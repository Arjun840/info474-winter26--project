(function () {
  window.VizReliabilityHist = {
    draw: function (p, manager, ai, progress) {
      if (ai !== 9) return;

      var data = manager.resortData || [];
      if (!data || data.length === 0) return;

      var mL = 90, mR = 40, mT = 70, mB = 70;
      var chartX = mL;
      var chartY = mT;
      var chartW = p.width - mL - mR;
      var chartH = p.height - mT - mB;

      p.push();
      p.noStroke();
      p.fill(242, 248, 252);
      p.rect(0, 0, p.width, p.height);

      p.fill(25);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(20);
      p.text("Snow Reliability Distribution", p.width / 2, 18);

      var vals = [];
      for (var i = 0; i < data.length; i++) {
        var r = parseFloat(data[i]["reliability"]);
        if (isFinite(r)) vals.push(r);
      }
      if (vals.length === 0) return;

      var minR = 0, maxR = 1;
      var bins = 20;
      var counts = new Array(bins).fill(0);

      for (var j = 0; j < vals.length; j++) {
        var v = vals[j];
        if (v < minR) v = minR;
        if (v > maxR) v = maxR;
        var b = Math.floor(((v - minR) / (maxR - minR)) * bins);
        if (b === bins) b = bins - 1;
        counts[b] += 1;
      }

      var maxCount = 1;
      for (var k = 0; k < counts.length; k++) {
        maxCount = Math.max(maxCount, counts[k]);
      }

      function xForBin(b) {
        return chartX + (b / bins) * chartW;
      }

      function yForCount(c) {
        return chartY + chartH - (c / maxCount) * chartH;
      }

      p.stroke(30);
      p.strokeWeight(1);
      p.line(chartX, chartY, chartX, chartY + chartH);
      p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

      p.noStroke();
      p.fill(40);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Reliability (0 → 1)", chartX + chartW / 2, chartY + chartH + 30);

      p.push();
      p.translate(30, chartY + chartH / 2);
      p.rotate(-p.PI / 2);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Number of Resorts", 0, 0);
      p.pop();

      p.fill(40);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      var xTicks = 5;
      for (var t = 0; t <= xTicks; t++) {
        var tv = minR + (t / xTicks) * (maxR - minR);
        var tx = chartX + (t / xTicks) * chartW;
        p.stroke(30);
        p.line(tx, chartY + chartH, tx, chartY + chartH + 6);
        p.noStroke();
        p.text(tv.toFixed(1), tx, chartY + chartH + 10);
      }

      p.textAlign(p.RIGHT, p.CENTER);
      var yTicks = 4;
      for (var yt = 0; yt <= yTicks; yt++) {
        var cVal = Math.round((yt / yTicks) * maxCount);
        var yy = yForCount(cVal);
        p.stroke(225, 235, 242);
        p.line(chartX, yy, chartX + chartW, yy);
        p.stroke(30);
        p.line(chartX - 6, yy, chartX, yy);
        p.noStroke();
        p.fill(40);
        p.text(String(cVal), chartX - 10, yy);
      }

      var barW = chartW / bins;
      var anim = Math.max(0, Math.min(1, progress));

      for (var b2 = 0; b2 < bins; b2++) {
        var c2 = counts[b2];
        var x0 = xForBin(b2) + 1;
        var targetY = yForCount(c2);
        var y0 = p.lerp(chartY + chartH, targetY, anim);
        var h = (chartY + chartH) - y0;

        var startColor = [230, 240, 250];
        var endColor = [92, 146, 188];
        var tColor = b2 / (bins - 1);

        var rCol = p.lerp(startColor[0], endColor[0], tColor);
        var gCol = p.lerp(startColor[1], endColor[1], tColor);
        var bCol = p.lerp(startColor[2], endColor[2], tColor);

        p.noStroke();
        p.fill(rCol, gCol, bCol, 235);
        p.rect(x0, y0, barW - 2, h, 2);
      }

      vals.sort(function (a, b) {
        return a - b;
      });

      var sum = 0;
      for (var s = 0; s < vals.length; s++) {
        sum += vals[s];
      }

      var mean = sum / vals.length;
      var median = vals.length % 2 === 0
        ? (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
        : vals[Math.floor(vals.length / 2)];

      function xForVal(v) {
        return chartX + ((v - minR) / (maxR - minR)) * chartW;
      }

      p.strokeWeight(2);
      p.stroke(45, 85, 125);
      var mx = xForVal(mean);
      p.line(mx, chartY, mx, chartY + chartH);

      p.stroke(140, 170, 195);
      var medx = xForVal(median);
      p.line(medx, chartY, medx, chartY + chartH);

      p.noStroke();
      p.fill(45, 85, 125);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      p.text("mean: " + mean.toFixed(3), chartX, chartY - 34);

      p.fill(140, 170, 195);
      p.text("median: " + median.toFixed(3), chartX + 120, chartY - 34);

      p.pop();
    }
  };
})();