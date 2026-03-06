# services/raster.py
# Extracts BioClim values from .tif raster files at a given lat/lng.

import os
import rasterio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BIOCLIM_VARS = {
    "bio01": "wc2.1_2.5m_bio_1.tif",   # Annual Mean Temperature (°C)
    "bio05": "wc2.1_2.5m_bio_5.tif",   # Max Temp of Warmest Month (°C)
    "bio06": "wc2.1_2.5m_bio_6.tif",   # Min Temp of Coldest Month (°C)
    "bio12": "wc2.1_2.5m_bio_12.tif",  # Annual Precipitation (mm)
    "bio15": "wc2.1_2.5m_bio_15.tif",  # Precipitation Seasonality (CV)
    "bio19": "wc2.1_2.5m_bio_19.tif",  # Precipitation of Coldest Quarter (mm)
}

RASTER_DIR = Path(os.getenv("RASTER_DIR", "data/rasters"))
LAND_MASK   = RASTER_DIR / "gshhs_land_water_mask_3km_i.tif"

def is_land(lat: float, lng: float) -> bool:
    
   # Samples the GSHHG land mask at the given coordinate.
   # Returns True if land (value = 100), False if water (value = 0).

   # WHY this file: matches our WorldClim 2.5m resolution closely enough
   # (3km vs 4.5km) and covers all water bodies including lakes and ocean.
   
    with rasterio.open(LAND_MASK) as ds:
        result = list(ds.sample([(lng, lat)]))[0][0]
        return float(result) == 100.0


def extract_bioclim(lat: float, lng: float) -> dict:
    """
    Opens each BioClim .tif file and reads the pixel value at (lat, lng).
    Returns a dict like: {"bio01": 19.6, "bio05": 25.3, ...}

    WHY rasterio: standard Python library for geospatial rasters.
    WHY lng first in sample(): rasterio uses (x, y) = (longitude, latitude).
    WHY float(): rasterio returns numpy.float32 which JSON cannot serialize.
    WorldClim 2.1 stores all values as real floats — no unit conversion needed.
    """
      # Step 0 — land mask check before touching climate rasters
    if not LAND_MASK.exists():
        raise FileNotFoundError(f"Land mask not found: {LAND_MASK}")

    if not is_land(lat, lng):
        raise ValueError(
            "This location appears to be water (ocean or lake). "
            "Please click on land within Kenya."
        )

    # Step 1 — extract climate values
    values = {}

    for var_name, filename in BIOCLIM_VARS.items():
        filepath = RASTER_DIR / filename

        if not filepath.exists():
            raise FileNotFoundError(f"Raster file not found: {filepath}")

        with rasterio.open(filepath) as dataset:
            result = list(dataset.sample([(lng, lat)]))[0][0]

            if result == dataset.nodata or result is None:
                raise ValueError(
                    "No climate data at this location. "
                    "Try a point on land within Kenya."
                )

            values[var_name] = round(float(result), 1)

    return values