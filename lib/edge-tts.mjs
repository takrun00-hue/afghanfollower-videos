// Minimal, dependency-free client for Microsoft Edge's neural text-to-speech
// (the same service the `edge-tts` package uses). Returns MP3 bytes for a
// Persian (or any) voice via a raw WebSocket over the upgraded HTTPS socket —
// Node's global WebSocket cannot send the custom handshake headers this
// endpoint requires.
import https from "node:https";
import crypto from "node:crypto";

const TRUSTED = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const GEC_VERSION = "1-143.0.3650.75";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";
const ORIGIN = "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold";

function dateString() {
  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n) => String(n).padStart(2, "0");
  return `${days[d.getUTCDay()]} ${mon[d.getUTCMonth()]} ${p(d.getUTCDate())} ${d.getUTCFullYear()} ${p(
    d.getUTCHours()
  )}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`;
}

// Sec-MS-GEC: SHA256 of (current 100ns Windows ticks rounded down to 5 min + trusted token).
function secMsGec() {
  let ticks = Math.floor(Date.now() / 1000) + 11644473600; // Unix -> Windows epoch
  ticks -= ticks % 300;
  return crypto
    .createHash("sha256")
    .update(String(ticks * 10000000) + TRUSTED, "ascii")
    .digest("hex")
    .toUpperCase();
}

// --- WebSocket frame helpers (RFC 6455) ---
function encodeFrame(opcode, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8");
  const maskKey = crypto.randomBytes(4);
  const len = body.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(6);
    header[1] = 0x80 | len;
    maskKey.copy(header, 2);
  } else if (len < 65536) {
    header = Buffer.alloc(8);
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
    maskKey.copy(header, 4);
  } else {
    header = Buffer.alloc(14);
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
    maskKey.copy(header, 10);
  }
  header[0] = 0x80 | opcode;
  const masked = Buffer.from(body);
  for (let i = 0; i < masked.length; i++) masked[i] ^= maskKey[i % 4];
  return Buffer.concat([header, masked]);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mkssml(text, voice, rate, pitch, volume) {
  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fa-IR'>` +
    `<voice name='${voice}'>` +
    `<prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>` +
    `${escapeXml(text)}` +
    `</prosody></voice></speak>`
  );
}

// One voice request. Resolves with the raw MP3 bytes.
export function synthesize({ text, voice = "fa-IR-FaridNeural", rate = "+0%", pitch = "+0Hz", volume = "+0%", timeoutMs = 20000 }) {
  return new Promise((resolve, reject) => {
    const connectId = crypto.randomUUID().replace(/-/g, "");
    const muid = crypto.randomBytes(16).toString("hex").toUpperCase();
    const url =
      `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
      `?TrustedClientToken=${TRUSTED}&ConnectionId=${connectId}` +
      `&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=${GEC_VERSION}`;
    const key = crypto.randomBytes(16).toString("base64");

    const req = https.request(url, {
      method: "GET",
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": key,
        "User-Agent": UA,
        Origin: ORIGIN,
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Cookie": `muid=${muid};`,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const timer = setTimeout(() => finish(new Error("TTS timeout")), timeoutMs);

    function finish(err, buffer) {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(buffer);
    }

    req.on("response", (res) => {
      let body = "";
      res.on("data", (d) => (body += d.toString("utf8")));
      res.on("end", () => finish(new Error(`TTS HTTP ${res.statusCode}: ${body.slice(0, 200)}`)));
    });
    req.on("error", (e) => finish(e));
    req.on("upgrade", (res, socket, head) => {
      const audio = [];
      let buf = head && head.length ? head : Buffer.alloc(0);
      let fragOpcode = null;
      let fragParts = [];
      let done = false;

      function handleComplete(opcode, payload) {
        if (opcode === 0x1) {
          const text = payload.toString("utf8");
          const path = text.split("\r\n").find((l) => l.startsWith("Path:"));
          if (path === "Path:turn.end") {
            done = true;
            try {
              socket.write(encodeFrame(0x8, Buffer.from([0x03, 0xe8]))); // close 1000
            } catch {}
            socket.end();
            finish(null, Buffer.concat(audio));
          }
        } else if (opcode === 0x2) {
          // first two bytes = header length, remainder = audio/mpeg payload
          if (payload.length >= 2) {
            const hlen = payload.readUInt16BE(0);
            const data = payload.subarray(2 + hlen);
            if (data.length) audio.push(data);
          }
        }
      }

      function handleFrame(opcode, payload, fin) {
        if (opcode === 0x0) {
          fragParts.push(payload);
          if (fin) {
            handleComplete(fragOpcode, Buffer.concat(fragParts));
            fragOpcode = null;
            fragParts = [];
          }
          return;
        }
        if (opcode === 0x8) {
          socket.end();
          if (!done) finish(null, Buffer.concat(audio));
          return;
        }
        if (opcode === 0x9) {
          socket.write(encodeFrame(0xa, payload)); // pong
          return;
        }
        if (opcode === 0xa) return; // pong
        if (!fin) {
          fragOpcode = opcode;
          fragParts = [payload];
          return;
        }
        handleComplete(opcode, payload);
      }

      socket.on("data", (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        for (;;) {
          if (buf.length < 2) return;
          const b0 = buf[0];
          const b1 = buf[1];
          const fin = (b0 & 0x80) !== 0;
          const opcode = b0 & 0x0f;
          const masked = (b1 & 0x80) !== 0;
          let len = b1 & 0x7f;
          let offset = 2;
          if (len === 126) {
            if (buf.length < 4) return;
            len = buf.readUInt16BE(2);
            offset = 4;
          } else if (len === 127) {
            if (buf.length < 10) return;
            len = Number(buf.readBigUInt64BE(2));
            offset = 10;
          }
          let maskKey = null;
          if (masked) {
            if (buf.length < offset + 4) return;
            maskKey = buf.subarray(offset, offset + 4);
            offset += 4;
          }
          if (buf.length < offset + len) return;
          let payload = buf.subarray(offset, offset + len);
          if (maskKey) {
            payload = Buffer.from(payload);
            for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
          }
          buf = buf.subarray(offset + len);
          handleFrame(opcode, payload, fin);
          if (done) return;
        }
      });
      socket.on("error", (e) => finish(e));
      socket.on("close", () => {
        if (!done) finish(null, Buffer.concat(audio));
      });

      // Send speech.config then the SSML request.
      const ts = dateString();
      socket.write(
        encodeFrame(
          0x1,
          `X-Timestamp:${ts}\r\n` +
            `Content-Type:application/json; charset=utf-8\r\n` +
            `Path:speech.config\r\n\r\n` +
            `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`
        )
      );
      socket.write(
        encodeFrame(
          0x1,
          `X-RequestId:${connectId}\r\n` +
            `Content-Type:application/ssml+xml\r\n` +
            `X-Timestamp:${ts}Z\r\n` +
            `Path:ssml\r\n\r\n` +
            mkssml(text, voice, rate, pitch, volume)
        )
      );
    });
    req.end();
  });
}

export const PERSIAN_VOICES = ["fa-IR-FaridNeural", "fa-IR-DilaraNeural"];
