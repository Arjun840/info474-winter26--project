(function () {
    function clamp(x, lo, hi) {
      return Math.max(lo, Math.min(hi, x));
    }
  
    function toNumber(x, fallback) {
      var n = parseFloat(x);
      return isFinite(n) ? n : fallback;
    }
  
    function projectLonLat(lon, lat, plotX, plotY, plotW, plotH) {
      var x = plotX + ((lon + 180) / 360) * plotW;
      var y = plotY + ((90 - lat) / 180) * plotH;
      return { x: x, y: y };
    }
  
    function buildMonthlyLookup(monthlyRows) {
      var by = {};
      (monthlyRows || []).forEach(function (r) {
        var id = String(r.ID);
        var m = String(r.Month);
        var snow = toNumber(r.Snow, NaN);
        if (!by[id]) by[id] = {};
        if (isFinite(snow)) by[id][m] = snow;
      });
      return by;
    }
  
    function drawPolygonRings(p, rings, plotX, plotY, plotW, plotH) {
      for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        p.beginShape();
        for (var i = 0; i < ring.length; i++) {
          var pt = ring[i];
          var lon = pt[0];
          var lat = pt[1];
          var xy = projectLonLat(lon, lat, plotX, plotY, plotW, plotH);
          p.vertex(xy.x, xy.y);
        }
        p.endShape(p.CLOSE);
      }
    }
  
    function drawCountriesFromGeoJSON(p, features, plotX, plotY, plotW, plotH) {
      for (var f = 0; f < features.length; f++) {
        var geom = features[f].geometry;
        if (!geom) continue;
  
        if (geom.type === "Polygon") {
          drawPolygonRings(p, geom.coordinates, plotX, plotY, plotW, plotH);
        } else if (geom.type === "MultiPolygon") {
          var polys = geom.coordinates;
          for (var k = 0; k < polys.length; k++) {
            drawPolygonRings(p, polys[k], plotX, plotY, plotW, plotH);
          }
        }
      }
    }
  
    window.VizWorldHeatmap = {
      ACTIVE_INDICES: { 8: true },
  
      draw: function (p, manager, ai, progress) {
        if (!window.VizWorldHeatmap.ACTIVE_INDICES[ai]) return;
  
        var resorts = manager.resortData || [];
        if (!resorts || resorts.length === 0) return;
  
        var plotX = manager.offsetX || 20;
        var plotY = manager.offsetY || 0;
        var plotW = manager.width || 600;
        var plotH = manager.height || 520;
        var legendX = plotX + plotW + 30;
        var legendY = plotY + 60;
  
        if (!manager.__worldTopo && !manager.__worldTopoLoading) {
          manager.__worldTopoLoading = true;
          p.loadJSON("https://unpkg.com/world-atlas@2/countries-110m.json", function (world) {
            manager.__worldTopo = world;
            manager.__worldTopoLoading = false;
            manager.__worldGeo = null;
          }, function () {
            manager.__worldTopoLoading = false;
          });
        }
  
        if (manager.__worldTopo && !manager.__worldGeo && window.topojson && typeof window.topojson.feature === "function") {
          try {
            var obj = manager.__worldTopo.objects && manager.__worldTopo.objects.countries;
            if (obj) {
              manager.__worldGeo = window.topojson.feature(manager.__worldTopo, obj);
            }
          } catch (e) {
          }
        }
  
        p.push();
        p.noStroke();
        p.fill(255);
        p.rect(0, 0, manager.canvasWidth || p.width, manager.canvasHeight || p.height);
        p.pop();
  
        p.push();
        p.noFill();
        p.stroke(0, 40);
        p.rect(plotX, plotY, plotW, plotH);
        p.pop();
  
        if (manager.__worldGeo && manager.__worldGeo.features) {
          p.push();
          p.noFill();
          p.stroke(0, 30);
          p.strokeWeight(1);
          drawCountriesFromGeoJSON(p, manager.__worldGeo.features, plotX, plotY, plotW, plotH);
          p.pop();
        } else {
          p.push();
          p.stroke(0, 14);
          p.noFill();
          for (var lon = -180; lon <= 180; lon += 60) {
            var a = projectLonLat(lon, 90, plotX, plotY, plotW, plotH);
            var b = projectLonLat(lon, -90, plotX, plotY, plotW, plotH);
            p.line(a.x, a.y, b.x, b.y);
          }
          for (var lat = -60; lat <= 60; lat += 30) {
            var c = projectLonLat(-180, lat, plotX, plotY, plotW, plotH);
            var d = projectLonLat(180, lat, plotX, plotY, plotW, plotH);
            p.line(c.x, c.y, d.x, d.y);
          }
          p.pop();
        }
  
        var useMonthly = false;
        var monthlyLookup = null;
        var chosenMonth = null;
  
        if (useMonthly) {
          if (!manager.__monthlyLookupBuilt) {
            manager.__monthlyLookup = buildMonthlyLookup(manager.monthlyData || []);
            manager.__monthlyLookupBuilt = true;
          }
          monthlyLookup = manager.__monthlyLookup || {};
          var months = manager.__monthsCache;
          if (!months) {
            var ms = {};
            (manager.monthlyData || []).forEach(function (r) {
              ms[String(r.Month)] = true;
            });
            months = Object.keys(ms).sort();
            manager.__monthsCache = months;
          }
          if (months.length > 0) {
            var idx = Math.floor(clamp(progress, 0, 0.999999) * months.length);
            chosenMonth = months[idx];
          }
        }
  
        if (!manager.__heatGfx || manager.__heatGfx.width !== plotW || manager.__heatGfx.height !== plotH) {
          manager.__heatGfx = p.createGraphics(plotW, plotH);
        }
        var g = manager.__heatGfx;
  
        g.clear();
        g.noStroke();
  
        var spread = 10 + 25 * clamp(progress, 0, 1);
  
        for (var i = 0; i < resorts.length; i++) {
          var r = resorts[i];
          var lat = toNumber(r.Latitude, NaN);
          var lon = toNumber(r.Longitude, NaN);
          if (!isFinite(lat) || !isFinite(lon)) continue;
  
          var v = 0;
          if (useMonthly && chosenMonth && monthlyLookup && monthlyLookup[String(r.ID)]) {
            v = toNumber(monthlyLookup[String(r.ID)][chosenMonth], 0);
          } else {
            v = toNumber(r.avg_snow, 0);
          }
          v = clamp(v, 0, 100);
  
          var pt = projectLonLat(lon, lat, 0, 0, plotW, plotH);
          var alpha = 10 + (v / 100) * 55;
          var rad = spread + (v / 100) * 22;
  
          g.fill(255, 80, 0, alpha);
          g.ellipse(pt.x, pt.y, rad, rad);
        }
  
        p.image(g, plotX, plotY);
  
        var mx = p.mouseX;
        var my = p.mouseY;
        var hovered = null;
        var bestDist = 1e9;
  
        p.push();
        p.stroke(0, 120);
        p.fill(0, 180);
        for (var j = 0; j < resorts.length; j++) {
          var rr = resorts[j];
          var lat2 = toNumber(rr.Latitude, NaN);
          var lon2 = toNumber(rr.Longitude, NaN);
          if (!isFinite(lat2) || !isFinite(lon2)) continue;
  
          var xy = projectLonLat(lon2, lat2, plotX, plotY, plotW, plotH);
          p.ellipse(xy.x, xy.y, 4, 4);
  
          var dx = mx - xy.x;
          var dy = my - xy.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            hovered = { row: rr, x: xy.x, y: xy.y };
          }
        }
        p.pop();
  
        p.push();
        p.fill(0);
        p.noStroke();
        p.textSize(16);
        p.textStyle(p.BOLD);
        p.text("Global Snowfall Heatmap (Resort Density)", plotX, plotY + 22);
  
        p.textSize(11);
        p.textStyle(p.NORMAL);
        var subtitle = useMonthly && chosenMonth ? ("Month: " + chosenMonth) : "Metric: avg_snow (0–100)";
        p.text(subtitle, plotX, plotY + 40);
        p.pop();
  
        var legW = 16;
        var legH = 180;
  
        p.push();
        p.noStroke();
        for (var t = 0; t < legH; t++) {
          var frac = 1 - t / (legH - 1);
          var a2 = 30 + frac * 120;
          p.fill(255, 80, 0, a2);
          p.rect(legendX, legendY + t, legW, 1);
        }
  
        p.stroke(0, 60);
        p.noFill();
        p.rect(legendX, legendY, legW, legH);
  
        p.noStroke();
        p.fill(0);
        p.textSize(11);
        p.text("Snow", legendX, legendY - 10);
        p.text("100", legendX + legW + 8, legendY + 10);
        p.text("0", legendX + legW + 8, legendY + legH);
        p.pop();
  
        var insidePlot =
          mx >= plotX && mx <= plotX + plotW &&
          my >= plotY && my <= plotY + plotH;
  
        if (insidePlot && hovered && bestDist <= (12 * 12)) {
          var h = hovered.row;
  
          var snowVal = useMonthly && chosenMonth && monthlyLookup && monthlyLookup[String(h.ID)]
            ? toNumber(monthlyLookup[String(h.ID)][chosenMonth], NaN)
            : toNumber(h.avg_snow, NaN);
  
          var lines = [
            String(h.Resort || "Unknown resort"),
            String(h.Country || ""),
            (isFinite(snowVal) ? ("Snow: " + snowVal.toFixed(1)) : "Snow: n/a")
          ];
  
          var padding = 8;
  
          p.push();
          p.textSize(11);
          p.textStyle(p.NORMAL);
  
          var w = 0;
          for (var k = 0; k < lines.length; k++) {
            w = Math.max(w, p.textWidth(lines[k]));
          }
          var boxW = w + padding * 2;
          var boxH = lines.length * 14 + padding * 2;
  
          var tx = hovered.x + 10;
          var ty = hovered.y - boxH - 10;
  
          tx = clamp(tx, plotX, plotX + plotW - boxW);
          ty = clamp(ty, plotY, plotY + plotH - boxH);
  
          p.noStroke();
          p.fill(255, 245);
          p.rect(tx, ty, boxW, boxH, 6);
  
          p.stroke(0, 40);
          p.noFill();
          p.rect(tx, ty, boxW, boxH, 6);
  
          p.noStroke();
          p.fill(0);
          for (var k2 = 0; k2 < lines.length; k2++) {
            p.text(lines[k2], tx + padding, ty + padding + 12 + k2 * 14);
          }
  
          p.stroke(0, 160);
          p.fill(255);
          p.ellipse(hovered.x, hovered.y, 8, 8);
  
          p.pop();
        }
      }
    };
  })();