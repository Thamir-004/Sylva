# services/prompt_builder.py
# Converts raw BioClim numbers into the natural language format
# the model was trained on.


def build_anchor_text(bio: dict) -> str:
    """
    Takes a dict of BioClim values and returns a natural language string
    that matches the format of your training pair anchors.

    Example output:
    "Location in Kenya with annual mean temperature 16.3 °C,
     annual precipitation 848 mm, precipitation seasonality 60,
     max temperature of warmest month 25.3 °C,
     min temperature of coldest month 7.6 °C,
     precipitation of coldest quarter 86 mm"

    WHY this exact format: your model learned the relationship between
    THIS specific phrasing and species descriptions. Using different
    wording would produce less accurate embeddings because the model
    wouldn't recognise the pattern it was trained on.
    """
    return (
        f"Location in Kenya with "
        f"annual mean temperature {bio['bio01']} °C, "
        f"annual precipitation {bio['bio12']} mm, "
        f"precipitation seasonality {bio['bio15']}, "
        f"max temperature of warmest month {bio['bio05']} °C, "
        f"min temperature of coldest month {bio['bio06']} °C, "
        f"precipitation of coldest quarter {bio['bio19']} mm"
    )