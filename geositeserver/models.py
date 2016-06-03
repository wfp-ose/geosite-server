from django.contrib.gis.db import models

class GeositeMap(models.Model):
    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    slug = models.CharField(max_length=255, null=True, blank=True)
    template = models.CharField(max_length=255, null=True, blank=True)
    center = models.PointField('Center', srid=4326, null=True)
    objects = models.GeoManager()

    def __str__(self):
        return "%s" % self.title.encode('utf-8')

    class Meta:
        ordering = ("title",)
        verbose_name = ("Geosite Maps")
        verbose_name_plural = ("Geosite Maps")
