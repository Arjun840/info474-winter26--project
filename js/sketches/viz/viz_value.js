// viz_value.js
// Scatterplot visualization: Price vs. Reliability with Quadrant Analysis
// Shows value proposition of ski resorts
(function () {
    window.VizValue = {
        draw: function (p, manager, ai, progress) {
            // Only draw when ai matches the intended step (adjust as needed)
            // For now, let's use ai === 4 or ai === 5 as examples
            if (ai !== 4 && ai !== 5) {
                return;
            }

            var data = manager.resortData || [];
            if (!data || data.length === 0) {
                return;
            }

            p.push();

            // Margins
            var m = 120;
            var chartX = m;
            var chartY = m;
            var chartWidth = p.width - 2 * m;
            var chartHeight = p.height - 2 * m;

            // Color palette
            var textColor = [38, 38, 38];      // #262626
            var bodyTextColor = [118, 118, 120]; // #767678
            var axisColor = [102, 102, 102];   // #666
            
            // Font styling
            var fontSize = 12;
            var fontSizeSmall = 10;
            var fontSizeTitle = 14;

            // 1. Data Setup: Extract Price and Reliability
            var prices = data.map(function (d) {
                return parseFloat(d['Price']) || 0;
            });
            var reliabilities = data.map(function (d) {
                return parseFloat(d['reliability']) || 0;
            });

            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            var priceRange = maxPrice - minPrice || 1;
            
            var minReliability = 0;
            var maxReliability = 1;

            // Calculate median price for quadrant center
            var sortedPrices = prices.slice().sort(function (a, b) { return a - b; });
            var medianPrice = sortedPrices.length % 2 === 0
                ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
                : sortedPrices[Math.floor(sortedPrices.length / 2)];
            
            var centerReliability = 0.5; // Fixed center for reliability

            // Scale functions
            var scaleX = function (val) {
                return chartX + ((val - minPrice) / priceRange) * chartWidth;
            };

            var scaleY = function (val) {
                // Invert Y so higher reliability is at the top
                return chartY + chartHeight - (val / (maxReliability - minReliability)) * chartHeight;
            };

            // 4. Color by Continent
            var continentColors = {
                'Europe': [70, 130, 180],      // Steel blue
                'North America': [220, 20, 60], // Crimson
                'Asia': [255, 165, 0],         // Orange
                'South America': [34, 139, 34], // Forest green
                'Oceania': [138, 43, 226],     // Blue violet
                'Africa': [255, 140, 0]        // Dark orange
            };

            // Prepare data with colors and positions
            var dataWithColors = data.map(function (d) {
                var price = parseFloat(d['Price']) || 0;
                var reliability = parseFloat(d['reliability']) || 0;
                var continent = d['Continent'] || 'Unknown';
                var x = scaleX(price);
                var y = scaleY(reliability);
                
                // Get color for continent, default to gray
                var color = continentColors[continent] || [128, 128, 128];
                
                return {
                    price: price,
                    reliability: reliability,
                    x: x,
                    y: y,
                    color: color,
                    name: d['Resort'] || 'Unknown',
                    country: d['Country'] || 'Unknown',
                    continent: continent
                };
            });

            // Draw background
            p.background(255);

            // Draw axes
            p.stroke(axisColor[0], axisColor[1], axisColor[2]);
            p.strokeWeight(2);
            p.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
            p.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis

            // 2. Quadrant Layout: Draw center lines
            var centerX = scaleX(medianPrice);
            var centerY = scaleY(centerReliability);
            
            // Draw dashed lines
            p.stroke(axisColor[0], axisColor[1], axisColor[2], 150);
            p.strokeWeight(1);
            p.drawingContext.setLineDash([5, 5]);
            
            // Vertical line (median price)
            p.line(centerX, chartY, centerX, chartY + chartHeight);
            
            // Horizontal line (0.5 reliability)
            p.line(chartX, centerY, chartX + chartWidth, centerY);
            
            p.drawingContext.setLineDash([]); // Reset dash

            // Label quadrants
            var labelOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.3) / 0.7));
            if (labelOpacity > 0) {
                p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(fontSizeSmall);
                
                // Top-Left: Budget/Reliable
                p.text('Budget/Reliable', chartX + (centerX - chartX) / 2, chartY + (centerY - chartY) / 2);
                
                // Top-Left annotation: Hidden Gems
                p.textSize(fontSizeSmall - 2);
                p.fill(textColor[0], textColor[1], textColor[2], labelOpacity * 0.7);
                p.text('(Hidden Gems)', chartX + (centerX - chartX) / 2, chartY + (centerY - chartY) / 2 + 15);
                p.textSize(fontSizeSmall);
                
                // Top-Right: Luxury/Reliable
                p.text('Luxury/Reliable', centerX + (chartX + chartWidth - centerX) / 2, chartY + (centerY - chartY) / 2);
                
                // Bottom-Left: Budget/Unreliable
                p.text('Budget/Unreliable', chartX + (centerX - chartX) / 2, centerY + (chartY + chartHeight - centerY) / 2);
                
                // Bottom-Right: Luxury/Unreliable
                p.text('Luxury/Unreliable', centerX + (chartX + chartWidth - centerX) / 2, centerY + (chartY + chartHeight - centerY) / 2);
            }

            // Draw axis labels and tick marks
            var axisLabelOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.2) / 0.8));
            p.fill(textColor[0], textColor[1], textColor[2], axisLabelOpacity);
            
            // X-axis title
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(fontSize);
            p.text('Price ($)', chartX + chartWidth / 2, chartY + chartHeight + 20);
            
            // X-axis tick marks and values
            var xTicks = 5;
            for (var i = 0; i <= xTicks; i++) {
                var tickVal = minPrice + (priceRange / xTicks) * i;
                var tickX = scaleX(tickVal);
                
                // Draw tick mark
                p.stroke(axisColor[0], axisColor[1], axisColor[2], axisLabelOpacity);
                p.strokeWeight(1.5);
                p.line(tickX, chartY + chartHeight, tickX, chartY + chartHeight + 5);
                p.noStroke();
                
                // Draw label
                p.fill(textColor[0], textColor[1], textColor[2], axisLabelOpacity);
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(fontSizeSmall);
                p.text('$' + Math.round(tickVal), tickX, chartY + chartHeight + 8);
            }
            
            // Y-axis title
            p.push();
            p.translate(chartX - 50, chartY + chartHeight / 2);
            p.rotate(-p.PI / 2);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(fontSize);
            p.text('Reliability (%)', 0, 0);
            p.pop();
            
            // Y-axis tick marks and values
            var yTicks = 5;
            for (var j = 0; j <= yTicks; j++) {
                var tickVal = minReliability + (maxReliability - minReliability) / yTicks * j;
                var tickY = scaleY(tickVal);
                
                // Draw tick mark
                p.stroke(axisColor[0], axisColor[1], axisColor[2], axisLabelOpacity);
                p.strokeWeight(1.5);
                p.line(chartX, tickY, chartX - 5, tickY);
                p.noStroke();
                
                // Draw label
                p.fill(textColor[0], textColor[1], textColor[2], axisLabelOpacity);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(fontSizeSmall);
                var percentVal = Math.round(tickVal * 100);
                p.text(percentVal + '%', chartX - 8, tickY);
            }

            // 4. Visuals: Draw dots with zoom animation from center
            var numPoints = data.length;
            var dotSize = 8;
            var hoverRadius = 15; // Radius for hover detection
            var hoveredResort = null;

            // Find hovered resort using p.dist()
            for (var i = 0; i < numPoints; i++) {
                var point = dataWithColors[i];
                var dist = p.dist(p.mouseX, p.mouseY, point.x, point.y);
                if (dist < hoverRadius) {
                    hoveredResort = point;
                    break;
                }
            }

            // Draw all points with zoom animation
            for (var i = 0; i < numPoints; i++) {
                var point = dataWithColors[i];
                var pointProgress = (i + 1) / numPoints;
                var shouldShow = pointProgress <= progress;
                
                if (!shouldShow) continue;

                // Zoom animation from center
                var animScale = 0;
                if (progress > 0) {
                    var animProgress = pointProgress / progress;
                    animScale = p.lerp(0, 1, animProgress);
                }
                
                var finalX = p.lerp(centerX, point.x, animScale);
                var finalY = p.lerp(centerY, point.y, animScale);
                var finalSize = dotSize * animScale;
                var opacity = 255 * animScale;

                // Draw point
                if (opacity > 0 && finalSize > 0) {
                    // Highlight if hovered
                    if (hoveredResort === point) {
                        p.stroke(255, 255, 0, opacity);
                        p.strokeWeight(3);
                    } else {
                        p.stroke(255, 255, 255, opacity * 0.8);
                        p.strokeWeight(1.5);
                    }
                    
                    p.fill(point.color[0], point.color[1], point.color[2], opacity);
                    p.ellipse(finalX, finalY, finalSize, finalSize);
                }
            }

            p.noStroke();

            // 3. Interactivity: Display tooltip when hovering
            if (hoveredResort) {
                var tooltipX = hoveredResort.x + 20;
                var tooltipY = hoveredResort.y - 40;
                
                // Keep tooltip within bounds
                if (tooltipX + 150 > p.width) {
                    tooltipX = hoveredResort.x - 170;
                }
                if (tooltipY < 0) {
                    tooltipY = hoveredResort.y + 20;
                }

                // Draw tooltip background
                p.fill(255, 255, 255, 240);
                p.stroke(textColor[0], textColor[1], textColor[2], 200);
                p.strokeWeight(2);
                p.rect(tooltipX - 10, tooltipY - 50, 160, 50, 5);

                // Draw tooltip content
                p.fill(textColor[0], textColor[1], textColor[2]);
                p.noStroke();
                p.textAlign(p.LEFT, p.TOP);
                p.textSize(fontSizeSmall);
                p.textStyle(p.BOLD);
                p.text(hoveredResort.name, tooltipX, tooltipY - 40);
                
                p.textStyle(p.NORMAL);
                p.fill(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
                p.text(hoveredResort.country, tooltipX, tooltipY - 25);
                p.text('$' + Math.round(hoveredResort.price), tooltipX, tooltipY - 10);
            }

            // Draw title (prominent)
            var titleOpacity = p.lerp(0, 255, Math.max(0, progress / 0.3));
            p.fill(textColor[0], textColor[1], textColor[2], titleOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(16);
            p.textStyle(p.BOLD);
            p.text('Price vs. Reliability: Finding Value', chartX + chartWidth / 2, chartY - 35);
            p.textStyle(p.NORMAL);

            // Draw legend for continents
            var legendOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.4) / 0.6));
            if (legendOpacity > 0) {
                var legendX = chartX + chartWidth + 10;
                var legendY = chartY + 20;
                var legendSpacing = 18;
                
                p.fill(255, 255, 255, legendOpacity * 0.9);
                p.stroke(textColor[0], textColor[1], textColor[2], legendOpacity * 0.5);
                p.strokeWeight(1);
                var legendHeight = Object.keys(continentColors).length * legendSpacing + 20;
                p.rect(legendX - 10, legendY - 10, 140, legendHeight, 4);
                
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(fontSizeSmall);
                var yPos = legendY;
                
                for (var continent in continentColors) {
                    var color = continentColors[continent];
                    p.fill(color[0], color[1], color[2], legendOpacity);
                    p.noStroke();
                    p.ellipse(legendX, yPos, 10, 10);
                    
                    p.fill(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2], legendOpacity);
                    p.text(continent, legendX + 15, yPos);
                    yPos += legendSpacing;
                }
            }

            p.pop();
        }
    };
})();
