"""Encode the four selected image_gen outputs; never regenerate the main eight plates."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

FRONTEND = Path(__file__).resolve().parents[1]
ART = FRONTEND / "public" / "experience-art" / "excursions"


def main() -> None:
    provenance = json.loads((ART / "provenance.json").read_text(encoding="utf-8"))
    records = {}
    for item in provenance["images"]:
        source = Path(item["sourceFile"])
        target = ART / f"{item['id']}.webp"
        with Image.open(source) as original:
            # A sub-percent crop establishes exact 16:9, without upscaling or creative retouching.
            image = ImageOps.fit(original.convert("RGB"), (1664, 936), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=88, method=6)
        records[item["id"]] = {
            "url": f"/experience-art/excursions/{target.name}",
            "width": 1664,
            "height": 936,
            "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "sourceBytes": source.stat().st_size,
            "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "quality": 88,
            "provenance": "/experience-art/excursions/provenance.json",
            "generated": True,
        }
    inventory_path = FRONTEND / "src" / "experience" / "content" / "runtime-assets.json"
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    inventory["excursions"] = records
    encoded = json.dumps(inventory, ensure_ascii=False, indent=2) + "\n"
    inventory_path.write_text(encoded, encoding="utf-8")
    (FRONTEND / "public" / "experience-art" / "runtime-assets.json").write_text(
        encoded, encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "images": len(records),
                "bytes": sum(item["bytes"] for item in records.values()),
                "dimensions": "1664x936",
            }
        )
    )


if __name__ == "__main__":
    main()
