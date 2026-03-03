// viz_bar.js
// Simple horizontal bar plot visual (12 months) using cached random values.
(function () {
    window.VizBar = {
        draw: function (p, manager, ai, progress) {
            p.push();
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            var left = manager.offsetX || 20;
            var top = manager.offsetY || 0;
            var availW = (manager.width || 600) - 40; // leave some right padding
            var availH = (manager.height || 520) - 20;
            var rowH = availH / months.length;
            var barMaxW = Math.max(60, availW - 120);
            var barUpdateEvery = 60; // regenerate every ~2s at 30fps

            // Color palette
            var textColor = [38, 38, 38];      // #262626
            var bodyTextColor = [118, 118, 120]; // #767678
            var axisColor = [102, 102, 102];   // #666

            if (!manager._barCounts || (p.frameCount % barUpdateEvery === 0)) {
                var bc = [];
                for (var m = 0; m < months.length; m++) bc.push(Math.random());
                manager._barCounts = bc;
            }

            var bc = manager._barCounts || [];
            p.noStroke();
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(12);

            // Draw title
            var titleOpacity = p.lerp(0, 255, Math.max(0, progress / 0.3));
            p.fill(textColor[0], textColor[1], textColor[2], titleOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.text('Monthly Distribution', left + availW / 2, top - 30);

            for (var i = 0; i < months.length; i++) {
                var y = top + i * rowH + rowH / 2;
                p.fill(textColor[0], textColor[1], textColor[2]);
                p.text(months[i], left, y);

                var val = bc[i] || 0;
                var bw = val * barMaxW;
                var bx = left + 60; // offset for labels
                var by = y - (rowH * 0.35);
                var bh = rowH * 0.7;
                p.fill(80, 150, 200, 220);
                p.rect(bx, by, bw, bh, 3);

                p.fill(255);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(Math.round(val * 100), bx + 6, y);
            }
            
            // X-axis label
            var labelOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.3) / 0.7));
            p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(12);
            p.text('Value (%)', left + availW / 2, top + availH + 10);
            
            // Y-axis label
            p.push();
            p.translate(left - 40, top + availH / 2);
            p.rotate(-p.PI / 2);
            p.text('Month', 0, 0);
            p.pop();
            
            p.pop();
        }
    };
})();
