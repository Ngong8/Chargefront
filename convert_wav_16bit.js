#!/usr/bin/env node
/*
 * convert_wav_16bit.js — convert any PCM .wav files to 16-bit PCM so browsers
 * can play them in <audio>.
 *
 * WHY: browsers cannot decode 24-bit / 32-bit WAV files (they fail with
 * MEDIA_ERR_SRC_NOT_SUPPORTED), so files exported from Soundly at 24-bit
 * play no sound in the game. Converting to 16-bit PCM fixes that.
 *
 * Usage (run from the Chargefront folder, or pass any folder):
 *   node convert_wav_16bit.js            -> converts every *.wav in ./SFX
 *   node convert_wav_16bit.js "MyFolder" -> converts every *.wav in MyFolder
 *
 * It rewrites the files IN PLACE (keeps sample rate + channels, drops bit
 * depth to 16). Keep the original Soundly masters elsewhere if you want them.
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || 'SFX');
if (!fs.existsSync(dir)) { console.error('Folder not found:', dir); process.exit(1); }
const files = fs.readdirSync(dir).filter((f) => /\.wav$/i.test(f));
if (!files.length) { console.log('No .wav files found in', dir); process.exit(0); }const origDir = path.join(dir, 'original');
if (!fs.existsSync(origDir)) fs.mkdirSync(origDir, { recursive: true });
for (const file of files) {
    const filePath = path.join(dir, file);
    const buf = fs.readFileSync(filePath);
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
        console.log('SKIP (not RIFF/WAVE):', file);
        continue;
    }
    let off = 12, fmt = null, data = null;
    while (off + 8 <= buf.length) {
        const id = buf.toString('ascii', off, off + 4);
        const size = buf.readUInt32LE(off + 4);
        if (id === 'fmt ') {
            fmt = {
                channels: buf.readUInt16LE(off + 10),
                sampleRate: buf.readUInt32LE(off + 12),
                bitsPerSample: buf.readUInt16LE(off + 22),
            };
        } else if (id === 'data') {
            data = { offset: off + 8, size };
        }
        off += 8 + size + (size & 1);
    }
    if (!fmt || !data) { console.log('SKIP (no fmt/data):', file); continue; }
    if (fmt.bitsPerSample <= 16) { console.log('SKIP (already ' + fmt.bitsPerSample + '-bit, browser-playable):', file); continue; }
    // reserve the original file before converting it in place
    const backupPath = path.join(origDir, file);
    if (!fs.existsSync(backupPath)) { fs.copyFileSync(filePath, backupPath); console.log('BACKED UP original ->', path.relative(dir, backupPath)); }
    else { console.log('BACKUP exists:', path.relative(dir, backupPath)); }
    const bytesPerSample = fmt.bitsPerSample >> 3;
    if (bytesPerSample < 1) { console.log('SKIP (bad bits per sample):', file); continue; }
    const sampleCount = Math.floor(data.size / bytesPerSample);
    const out = Buffer.alloc(sampleCount * 2);
    let oi = 0;
    for (let i = 0; i < sampleCount; i++) {
        let s = 0;
        const p = data.offset + i * bytesPerSample;
        if (fmt.bitsPerSample === 8) {
            s = (buf[p] - 128) << 8;                 // unsigned 8-bit -> 16-bit
        } else if (fmt.bitsPerSample === 16) {
            s = buf.readInt16LE(p);
        } else if (fmt.bitsPerSample === 24) {
            s = (buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16)) >> 8;  // 24-bit signed -> 16-bit signed
        } else {
            s = buf.readInt32LE(p) >> 16;            // 32-bit signed -> 16-bit signed
        }
        out.writeUInt16LE(s & 0xFFFF, oi);           // two's-complement 16-bit
        oi += 2;
    }
    // standard 16-bit PCM WAV header (44 bytes)
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + out.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);                     // PCM
    header.writeUInt16LE(fmt.channels, 22);
    header.writeUInt32LE(fmt.sampleRate, 24);
    header.writeUInt32LE(fmt.sampleRate * fmt.channels * 2, 28);
    header.writeUInt16LE(fmt.channels * 2, 32);
    header.writeUInt16LE(16, 34);                    // 16 bits
    header.write('data', 36);
    header.writeUInt32LE(out.length, 40);
    fs.writeFileSync(filePath, Buffer.concat([header, out]));
    console.log('CONVERTED:', file, fmt.channels + 'ch', fmt.sampleRate + 'Hz', fmt.bitsPerSample + 'bit -> 16bit');
}
console.log('Done.');
