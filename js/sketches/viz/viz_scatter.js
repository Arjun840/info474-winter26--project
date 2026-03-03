// viz_scatter.js
// Data-agnostic scatter viz — draws cached random points and updates them
// only occasionally to reduce churn.
(function () {
    window.VizScatter = {
        draw: function (p, manager, ai, progress) {
            p.push();
            var cols = manager.width || 600;
            var rows = manager.height || 520;
            var offsetX = (manager.offsetX || 0);
            var offsetY = (manager.offsetY || 0);
            var count = 120;
            var updateEvery = 15; // frames between regenerations (~0.5s at 30fps)

            // Color palette
            var textColor = [38, 38, 38];      // #262626
            var bodyTextColor = [118, 118, 120]; // #767678

            if (!manager._randomPoints || (p.frameCount % updateEvery === 0)) {
                var pts = [];
                for (var i = 0; i < count; i++) {
                    var rx = offsetX + Math.random() * cols;
                    var ry = offsetY + Math.random() * rows;
                    var rsz = 2 + Math.random() * 6;
                    var r = Math.floor(30 + Math.random() * 60);
                    var g = Math.floor(100 + Math.random() * 80);
                    var b = Math.floor(160 + Math.random() * 40);
                    var a = 180;
                    pts.push({ x: rx, y: ry, r: rsz, c: [r, g, b, a] });
                }
                manager._randomPoints = pts;
            }

            // Draw title
            var titleOpacity = p.lerp(0, 255, Math.max(0, progress / 0.3));
            p.fill(textColor[0], textColor[1], textColor[2], titleOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.text('Scatter Plot Visualization', offsetX + cols / 2, offsetY - 30);

            p.noStroke();
            var pts = manager._randomPoints || [];
            for (var j = 0; j < pts.length; j++) {
                var ptd = pts[j];
                var col = ptd.c;
                p.fill(col[0], col[1], col[2], col[3]);
                p.ellipse(ptd.x, ptd.y, ptd.r, ptd.r);
            }
            
            // Add axis labels (generic for demo)
            var labelOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.3) / 0.7));
            p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(12);
            p.text('X-Axis', offsetX + cols / 2, offsetY + rows + 20);
            
            p.push();
            p.translate(offsetX - 40, offsetY + rows / 2);
            p.rotate(-p.PI / 2);
            p.text('Y-Axis', 0, 0);
            p.pop();
            
            p.pop();
        }
    };
})();
