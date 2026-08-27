"""Generate the PWA icons: a 3x3 dot grid (logged + unlogged days) on an off-black tile.

Pure stdlib — no Pillow. Renders 4x supersampled, box-downsamples, writes PNG.
"""
import struct, zlib, os

BG = (0x14, 0x13, 0x12)
DIM = (0x2E, 0x2C, 0x29)
RED = (0xD0, 0x68, 0x5A)
YELLOW = (0xC4, 0xA8, 0x3D)
BLUE = (0x6A, 0x8C, 0xBD)
GREEN = (0x7B, 0xA0, 0x5E)

GRID = [
    [RED, DIM, YELLOW],
    [DIM, BLUE, DIM],
    [GREEN, DIM, DIM],
]

def render(size):
    ss = 4
    S = size * ss
    r = S * 0.072
    step = S * 0.24
    c0 = S / 2 - step
    big = [[BG] * S for _ in range(S)]
    for row in range(3):
        for col in range(3):
            color = GRID[row][col]
            cx, cy = c0 + col * step, c0 + row * step
            x0, x1 = int(cx - r) - 1, int(cx + r) + 2
            y0, y1 = int(cy - r) - 1, int(cy + r) + 2
            r2 = r * r
            for y in range(y0, y1):
                dy2 = (y + 0.5 - cy) ** 2
                line = big[y]
                for x in range(x0, x1):
                    if (x + 0.5 - cx) ** 2 + dy2 <= r2:
                        line[x] = color
    px = bytearray()
    n = ss * ss
    for y in range(size):
        px.append(0)
        for x in range(size):
            rs = gs = bs = 0
            for yy in range(y * ss, (y + 1) * ss):
                line = big[yy]
                for xx in range(x * ss, (x + 1) * ss):
                    c = line[xx]
                    rs += c[0]; gs += c[1]; bs += c[2]
            px += bytes((rs // n, gs // n, bs // n))
    return bytes(px)

def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

def png(size, path):
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    blob = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(render(size), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(blob)
    print(path, os.path.getsize(path), "bytes")

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "icons")
    for s in (180, 192, 512):
        png(s, os.path.join(out, f"icon-{s}.png"))
