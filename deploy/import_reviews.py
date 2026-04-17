import json

from api.models import Review

with open("/tmp/reviews-seed.json", "r", encoding="utf-8") as f:
    data = json.load(f)

Review.objects.all().delete()
for idx, item in enumerate(data, start=1):
    Review.objects.create(
        name=item["name"],
        text=item["text"],
        rating=int(item.get("rating", 5)),
        is_published=True,
        sort_order=idx,
    )

print("CREATED", Review.objects.count())
