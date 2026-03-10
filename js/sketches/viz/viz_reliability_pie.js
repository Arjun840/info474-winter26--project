(function () {
  window.VizReliabilityPie = {
    draw: function (p, manager, ai, progress) {
      if (ai !== 10) return;

      var data = manager.resortData || [];
      if (!data || data.length === 0) return;

      var low = 0, med = 0, high = 0;

      for (var i = 0; i < data.length; i++) {
        var r = parseFloat(data[i]["reliability"]);
        if (!isFinite(r)) continue;
        if (r < 0.4) low++;
        else if (r <= 0.7) med++;
        else high++;
      }

      var total = low + med + high;
      if (total === 0) return;

      p.push();
      p.background(242, 248, 252);

      p.fill(25);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(20);
      p.text("Resort Reliability Breakdown", p.width / 2, 18);

      var cx = p.width / 2;
      var cy = p.height / 2 + 10;
      var radius = Math.min(p.width, p.height) * 0.28;

      var values = [low, med, high];
      var labels = ["Low (< 0.40)", "Medium (0.40–0.70)", "High (> 0.70)"];
      var colors = [
        [34, 139, 34],  
        [255, 215, 0],   
        [255, 140, 0]     
      ];

      var start = -p.HALF_PI;
      var anim = Math.max(0, Math.min(1, progress));
      var endLimit = start + anim * p.TWO_PI;

      for (var s = 0; s < values.length; s++) {
        var frac = values[s] / total;
        var ang = frac * p.TWO_PI;
        var end = start + ang;

        var drawEnd = Math.min(end, endLimit);
        if (drawEnd > start) {
          var c = colors[s];
          p.fill(c[0], c[1], c[2]);
          p.noStroke();
          p.arc(cx, cy, radius * 2, radius * 2, start, drawEnd, p.PIE);
        }
        start = end;
      }

      p.noFill();
      p.stroke(45, 85, 125);
      p.strokeWeight(1);
      p.circle(cx, cy, radius * 2);

      var lx = cx + radius + 40;
      var ly = cy - radius + 10;

      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);

      for (var j = 0; j < values.length; j++) {
        var pct = (values[j] / total) * 100;
        var c2 = colors[j];

        p.fill(c2[0], c2[1], c2[2]);
        p.rect(lx, ly + j * 28, 14, 14, 2);

        p.fill(25);
        p.textSize(12);
        p.text(labels[j] + " — " + values[j] + " (" + pct.toFixed(1) + "%)", lx + 20, ly - 2 + j * 28);
      }

      var mx = p.mouseX - cx;
      var my = p.mouseY - cy;
      var d = Math.sqrt(mx * mx + my * my);

      if (d <= radius) {
        var angMouse = Math.atan2(my, mx) + Math.PI / 2;
        if (angMouse < 0) angMouse += Math.PI * 2;

        var cum = 0;
        var idx = -1;
        for (var k = 0; k < values.length; k++) {
          cum += values[k] / total;
          if (angMouse <= cum * Math.PI * 2) {
            idx = k;
            break;
          }
        }

        if (idx >= 0) {
          var boxW = 260, boxH = 54;
          var bx = Math.min(p.width - boxW - 12, Math.max(12, p.mouseX + 12));
          var by = Math.min(p.height - boxH - 12, Math.max(12, p.mouseY - boxH - 12));

          p.noStroke();
          p.fill(250, 253, 255);
          p.rect(bx, by, boxW, boxH, 8);

          p.stroke(120, 150, 180);
          p.noFill();
          p.rect(bx, by, boxW, boxH, 8);

          p.noStroke();
          p.fill(25);
          p.textAlign(p.LEFT, p.TOP);
          p.textSize(12);
          var pct2 = (values[idx] / total) * 100;
          p.text(labels[idx], bx + 10, by + 10);
          p.text(values[idx] + " resorts (" + pct2.toFixed(1) + "%)", bx + 10, by + 28);
        }
      }

      p.pop();
    }
  };
})();