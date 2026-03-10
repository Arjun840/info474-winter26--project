(function () {
  window.VizReliabilityPie = {
    draw: function (p, manager, ai, progress) {
      if (ai !== 10) return;

      var data = manager.resortData || [];
      if (!data || data.length === 0) return;

      var cleaned = [];
      for (var i = 0; i < data.length; i++) {
        var price = parseFloat(data[i]["Price"]);
        var continent = data[i]["Continent"];
        var resort = data[i]["Resort"] || "Unknown Resort";

        if (isFinite(price) && continent) {
          cleaned.push({
            Resort: resort,
            Continent: continent,
            Price: price
          });
        }
      }

      if (cleaned.length === 0) return;

      var continents = [];
      var seen = {};
      for (var j = 0; j < cleaned.length; j++) {
        var c = cleaned[j].Continent;
        if (!seen[c]) {
          seen[c] = true;
          continents.push(c);
        }
      }

      continents.sort();

      var minPrice = Infinity;
      var maxPrice = -Infinity;
      for (var k = 0; k < cleaned.length; k++) {
        if (cleaned[k].Price < minPrice) minPrice = cleaned[k].Price;
        if (cleaned[k].Price > maxPrice) maxPrice = cleaned[k].Price;
      }

      if (manager._boxSliderValue == null) {
        manager._boxSliderValue = maxPrice;
      }
      if (manager._boxSliderDragging == null) {
        manager._boxSliderDragging = false;
      }
      if (manager._boxSliderLock == null) {
        manager._boxSliderLock = false;
      }

      function quantile(sortedArr, q) {
        if (!sortedArr.length) return null;
        var pos = (sortedArr.length - 1) * q;
        var base = Math.floor(pos);
        var rest = pos - base;
        if (sortedArr[base + 1] !== undefined) {
          return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
        }
        return sortedArr[base];
      }

      function computeBoxStats(values) {
        if (!values || values.length === 0) return null;

        var arr = values.slice().sort(function (a, b) { return a - b; });

        var q1 = quantile(arr, 0.25);
        var median = quantile(arr, 0.5);
        var q3 = quantile(arr, 0.75);
        var iqr = q3 - q1;

        var lowerFence = q1 - 1.5 * iqr;
        var upperFence = q3 + 1.5 * iqr;

        var whiskerMin = arr[0];
        var whiskerMax = arr[arr.length - 1];
        var outliers = [];

        for (var i2 = 0; i2 < arr.length; i2++) {
          if (arr[i2] >= lowerFence) {
            whiskerMin = arr[i2];
            break;
          }
        }

        for (var j2 = arr.length - 1; j2 >= 0; j2--) {
          if (arr[j2] <= upperFence) {
            whiskerMax = arr[j2];
            break;
          }
        }

        for (var k2 = 0; k2 < arr.length; k2++) {
          if (arr[k2] < whiskerMin || arr[k2] > whiskerMax) {
            outliers.push(arr[k2]);
          }
        }

        return {
          q1: q1,
          median: median,
          q3: q3,
          whiskerMin: whiskerMin,
          whiskerMax: whiskerMax,
          outliers: outliers,
          count: arr.length
        };
      }

      function colorForContinent(continent) {
        if (continent === "Europe") return [52, 152, 219];
        if (continent === "North America") return [231, 76, 60];
        if (continent === "Asia") return [46, 204, 113];
        if (continent === "Oceania") return [241, 196, 15];
        if (continent === "South America") return [155, 89, 182];
        if (continent === "Africa") return [230, 126, 34];
        return [120, 120, 120];
      }

      p.push();
      p.background(242, 248, 252);

      var margin = {
        top: 72,
        right: 40,
        bottom: 130,
        left: 80
      };

      var chartX = margin.left;
      var chartY = margin.top;
      var chartW = p.width - margin.left - margin.right;
      var chartH = p.height - margin.top - margin.bottom;

      var sliderX = chartX;
      var sliderY = p.height - 48;
      var sliderW = chartW;
      var knobR = 9;

      function valueToSliderX(val) {
        return p.map(val, minPrice, maxPrice, sliderX, sliderX + sliderW);
      }

      function sliderXToValue(x) {
        return p.map(x, sliderX, sliderX + sliderW, minPrice, maxPrice);
      }

      var knobX = valueToSliderX(manager._boxSliderValue);
      var overKnob = p.dist(p.mouseX, p.mouseY, knobX, sliderY) <= knobR + 4;
      var overTrack =
        p.mouseX >= sliderX &&
        p.mouseX <= sliderX + sliderW &&
        p.mouseY >= sliderY - 10 &&
        p.mouseY <= sliderY + 10;

      if (p.mouseIsPressed && !manager._boxSliderLock && (overKnob || overTrack)) {
        manager._boxSliderDragging = true;
        manager._boxSliderLock = true;
      }

      if (!p.mouseIsPressed) {
        manager._boxSliderDragging = false;
        manager._boxSliderLock = false;
      }

      if (manager._boxSliderDragging) {
        var clampedX = Math.max(sliderX, Math.min(sliderX + sliderW, p.mouseX));
        manager._boxSliderValue = sliderXToValue(clampedX);
      }

      var activeMaxPrice = manager._boxSliderValue;

      var filtered = [];
      for (var m = 0; m < cleaned.length; m++) {
        if (cleaned[m].Price <= activeMaxPrice) {
          filtered.push(cleaned[m]);
        }
      }

      var grouped = {};
      for (var n = 0; n < continents.length; n++) {
        grouped[continents[n]] = [];
      }

      for (var o = 0; o < filtered.length; o++) {
        if (grouped[filtered[o].Continent]) {
          grouped[filtered[o].Continent].push(filtered[o].Price);
        }
      }

      var yMin = 0;
      var yMax = maxPrice;
      var yPad = (yMax - yMin) * 0.05;
      yMax += yPad;

      function yScale(val) {
        return p.map(val, yMin, yMax, chartY + chartH, chartY);
      }

      p.fill(25);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(20);
      p.text("Resort Price Distribution by Continent", p.width / 2, 18);

      var infoText =
        "Max price ≤ " + Math.round(activeMaxPrice) +
        "   |   Resorts shown: " + filtered.length;

      var infoBoxW = 290;
      var infoBoxH = 30;
      var infoBoxX = chartX;
      var infoBoxY = 44;

      p.noStroke();
      p.fill(250, 253, 255);
      p.rect(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 6);

      p.stroke(160, 180, 200);
      p.noFill();
      p.rect(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 6);

      p.noStroke();
      p.fill(25);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(12);
      p.text(infoText, infoBoxX + 10, infoBoxY + infoBoxH / 2);

      p.stroke(220, 228, 235);
      p.strokeWeight(1);
      var ticks = 5;
      for (var gy = 0; gy <= ticks; gy++) {
        var yy = chartY + (gy / ticks) * chartH;
        p.line(chartX, yy, chartX + chartW, yy);
      }

      p.stroke(70, 90, 110);
      p.strokeWeight(1.2);
      p.line(chartX, chartY, chartX, chartY + chartH);
      p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

      p.noStroke();
      p.fill(35);
      p.textSize(11);
      p.textAlign(p.RIGHT, p.CENTER);
      for (var ty = 0; ty <= ticks; ty++) {
        var yVal = yMin + ((ticks - ty) / ticks) * (yMax - yMin);
        var yPos = chartY + (ty / ticks) * chartH;
        p.text(Math.round(yVal), chartX - 8, yPos);
      }

      p.push();
      p.translate(22, chartY + chartH / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(13);
      p.fill(25);
      p.text("Price", 0, 0);
      p.pop();

      p.textAlign(p.CENTER, p.TOP);
      p.textSize(13);
      p.fill(25);
      p.text("Continent", chartX + chartW / 2, chartY + chartH + 64);

      var bandW = chartW / continents.length;
      var boxW = Math.min(60, bandW * 0.55);

      for (var q = 0; q < continents.length; q++) {
        var continent = continents[q];
        var values = grouped[continent];
        var stats = computeBoxStats(values);
        var centerX = chartX + q * bandW + bandW / 2;

        if (!stats) {
          p.noStroke();
          p.fill(120);
          p.textAlign(p.CENTER, p.TOP);
          p.textSize(10);
          p.text("n=0", centerX, chartY + chartH + 24);

          p.fill(25);
          p.textSize(11);
          p.text(continent, centerX, chartY + chartH + 42);
          continue;
        }

        var col = colorForContinent(continent);
        var yQ1 = yScale(stats.q1);
        var yMedian = yScale(stats.median);
        var yQ3 = yScale(stats.q3);
        var yMinW = yScale(stats.whiskerMin);
        var yMaxW = yScale(stats.whiskerMax);

        p.stroke(80, 95, 110);
        p.strokeWeight(1.5);
        p.line(centerX, yQ3, centerX, yMaxW);
        p.line(centerX, yQ1, centerX, yMinW);
        p.line(centerX - 12, yMaxW, centerX + 12, yMaxW);
        p.line(centerX - 12, yMinW, centerX + 12, yMinW);

        p.fill(col[0], col[1], col[2], 180);
        p.stroke(80, 95, 110);
        p.rectMode(p.CORNER);
        p.rect(centerX - boxW / 2, yQ3, boxW, yQ1 - yQ3);

        p.stroke(25);
        p.strokeWeight(2);
        p.line(centerX - boxW / 2, yMedian, centerX + boxW / 2, yMedian);

        p.noStroke();
        p.fill(50, 50, 50, 180);
        for (var r = 0; r < stats.outliers.length; r++) {
          p.circle(centerX, yScale(stats.outliers[r]), 5);
        }

        // n label moved below plot
        p.noStroke();
        p.fill(25);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text("n=" + stats.count, centerX, chartY + chartH + 24);

        // continent label lower so they do not overlap
        p.fill(25);
        p.textSize(11);
        p.text(continent, centerX, chartY + chartH + 42);
      }

      p.fill(25);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(12);
      p.text("Max price filter", sliderX, sliderY - 22);

      p.stroke(185, 195, 205);
      p.strokeWeight(4);
      p.line(sliderX, sliderY, sliderX + sliderW, sliderY);

      p.stroke(45, 85, 125);
      p.strokeWeight(5);
      p.line(sliderX, sliderY, valueToSliderX(activeMaxPrice), sliderY);

      p.noStroke();
      p.fill(35);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(10);
      p.text(Math.round(minPrice), sliderX, sliderY + 10);

      p.textAlign(p.RIGHT, p.TOP);
      p.text(Math.round(maxPrice), sliderX + sliderW, sliderY + 10);

      var drawKnobX = valueToSliderX(activeMaxPrice);
      p.fill(45, 85, 125);
      p.stroke(255);
      p.strokeWeight(1.5);
      p.circle(drawKnobX, sliderY, knobR * 2);

      p.noStroke();
      p.fill(25);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(11);
      p.text(Math.round(activeMaxPrice), drawKnobX, sliderY - 10);

      p.pop();
    }
  };
})();