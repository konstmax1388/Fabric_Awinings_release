import random
from datetime import datetime


def generate_order_ref() -> str:
    r = random.randint(1000, 9999)
    return f"FA-{datetime.now():%Y%m%d}-{r}"
