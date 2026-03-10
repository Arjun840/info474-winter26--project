// viz_seasonality.js
// Sparkline grid visualization showing monthly snow patterns for top resorts
(function () {
    window.VizSeasonality = {
        // Initialize transition state
        init: function (manager) {
            if (!manager.__seasonalityState) {
                manager.__seasonalityState = {
                    selectedContinent: 'All',
                    previousResorts: [],
                    currentResorts: [],
                    transitionProgress: 1.0,
                    transitionDuration: 30, // frames
                    transitionFrame: 0
                };
            }
        },

        draw: function (p, manager, ai, progress) {
            // Hide dropdown for all other visualizations
            if (ai !== 3) {
                this.hideDropdown();
                // Clear hover state when not on this visualization
                if (manager) {
                    manager.__sparklineHoveredResortId = null;
                }
                return;
            }

            // Initialize state if needed
            this.init(manager);
            var state = manager.__seasonalityState;

            var resortData = manager.resortData || [];
            var monthlyData = manager.monthlyData || [];
            
            if (!resortData.length || !monthlyData.length) {
                this.hideDropdown();
                return;
            }

            p.push();

            // Create dropdown if it doesn't exist and show it
            this.createDropdown(p, manager, resortData);
            this.showDropdown();

            // Get selected continent from dropdown
            var selectedContinent = this.getSelectedContinent(manager);
            
            // Check if continent changed
            if (selectedContinent !== state.selectedContinent) {
                state.selectedContinent = selectedContinent;
                state.previousResorts = state.currentResorts.slice();
                state.transitionProgress = 0;
                state.transitionFrame = 0;
            }

            // Update transition progress
            if (state.transitionProgress < 1.0) {
                state.transitionFrame++;
                state.transitionProgress = Math.min(1.0, state.transitionFrame / state.transitionDuration);
            }

            // Margins
            var m = 100;
            var chartX = m;
            var chartY = m + 60; // Extra space for dropdown
            var chartWidth = p.width - 2 * m;
            var chartHeight = p.height - 2 * m - 60;

            // Color palette
            var textColor = [38, 38, 38];      // #262626
            var bodyTextColor = [118, 118, 120]; // #767678
            var snowBlue = [135, 206, 235];   // Sky blue / Snow blue
            var axisColor = [102, 102, 102];   // #666
            
            // Font styling
            var fontSize = 11;
            var fontSizeSmall = 9;

            // 1. Data Logic: Filter by continent and quadrant filter, then find top 12 resorts by reliability
            var filteredData = resortData.slice();
            
            // Filter by continent if not "All"
            if (selectedContinent !== 'All') {
                filteredData = filteredData.filter(function (resort) {
                    return (resort['Continent'] || 'Unknown') === selectedContinent;
                });
            }
            
            // Filter by quadrant if selected (from scatter plot)
            if (manager.__quadrantFilter) {
                // Calculate median price and center reliability for filtering
                var prices = filteredData.map(function (d) { return parseFloat(d['Price']) || 0; });
                var sortedPrices = prices.slice().sort(function (a, b) { return a - b; });
                var medianPrice = sortedPrices.length % 2 === 0
                    ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
                    : sortedPrices[Math.floor(sortedPrices.length / 2)];
                var centerReliability = 0.5;
                
                filteredData = filteredData.filter(function (resort) {
                    var price = parseFloat(resort['Price']) || 0;
                    var reliability = parseFloat(resort['reliability']) || 0;
                    var isLowPrice = price <= medianPrice;
                    var isHighReliability = reliability >= centerReliability;
                    
                    switch (manager.__quadrantFilter) {
                        case 'hidden-gems':
                            return isLowPrice && isHighReliability;
                        case 'luxury-reliable':
                            return !isLowPrice && isHighReliability;
                        case 'budget-unreliable':
                            return isLowPrice && !isHighReliability;
                        case 'luxury-unreliable':
                            return !isLowPrice && !isHighReliability;
                        default:
                            return true;
                    }
                });
            }
            
            // Sort by reliability and get top 12
            var topResorts = filteredData
                .sort(function (a, b) {
                    return parseFloat(b['reliability']) - parseFloat(a['reliability']);
                })
                .slice(0, 12);
            
            // Store current resorts for next transition
            state.currentResorts = topResorts.map(function (r) {
                return r['ID'] || r['id'] || '';
            });

            // Grid layout: 4x3 (4 columns, 3 rows)
            var cols = 4;
            var rows = 3;
            var cellWidth = chartWidth / cols;
            var cellHeight = chartHeight / rows;
            var cellPadding = 10;

            // Month labels for X-axis (January through December)
            var monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var monthNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // For parsing

            // Process data for each resort
            var processedResorts = topResorts.map(function (resort) {
                var resortId = resort['ID'] || resort['id'];
                var resortName = resort['Resort'] || 'Unknown';
                
                // Filter monthly data for this resort
                var resortMonthly = monthlyData.filter(function (d) {
                    var dId = d['ID'] || d['id'] || d['resort_id'];
                    return String(dId) === String(resortId);
                });

                // Parse and organize monthly data
                var monthlyValues = [];
                for (var i = 0; i < monthNumbers.length; i++) {
                    var targetMonth = monthNumbers[i];
                    var found = false;
                    
                    for (var j = 0; j < resortMonthly.length; j++) {
                        var monthStr = resortMonthly[j]['Month'] || '';
                        // Parse YYYY-MM-DD format
                        var monthMatch = monthStr.match(/(\d{4})-(\d{2})/);
                        if (monthMatch) {
                            var monthNum = parseInt(monthMatch[2], 10);
                            if (monthNum === targetMonth) {
                                monthlyValues.push({
                                    month: targetMonth,
                                    monthLabel: monthLabels[i],
                                    snow: parseFloat(resortMonthly[j]['Snow']) || 0
                                });
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    if (!found) {
                        monthlyValues.push({
                            month: targetMonth,
                            monthLabel: monthLabels[i],
                            snow: 0
                        });
                    }
                }

                return {
                    id: resortId,
                    name: resortName,
                    monthly: monthlyValues
                };
            });

            // Calculate max snow value for scaling
            var maxSnow = 0;
            processedResorts.forEach(function (resort) {
                resort.monthly.forEach(function (m) {
                    if (m.snow > maxSnow) maxSnow = m.snow;
                });
            });
            maxSnow = maxSnow || 100; // Default to 100 if no data

            // Clear sparkline hover if mouse is not over any cell
            var anyCellHovered = false;
            
            // Draw grid of sparklines with transitions
            for (var row = 0; row < rows; row++) {
                for (var col = 0; col < cols; col++) {
                    var cellIndex = row * cols + col;
                    if (cellIndex >= processedResorts.length) break;

                    var resort = processedResorts[cellIndex];
                    
                    // Calculate target position
                    var targetX = chartX + col * cellWidth;
                    var targetY = chartY + row * cellHeight;
                    
                    // Find if this resort was in previous view and get its old position
                    var oldIndex = -1;
                    for (var i = 0; i < state.previousResorts.length; i++) {
                        var prevResortId = state.previousResorts[i];
                        var currentResortId = resort.id;
                        if (String(prevResortId) === String(currentResortId)) {
                            oldIndex = i;
                            break;
                        }
                    }
                    
                    // Calculate animated position during transition
                    var cellX, cellY, cellOpacity;
                    if (state.transitionProgress < 1.0 && oldIndex >= 0) {
                        // Resort exists in both views - animate from old to new position
                        var oldCol = oldIndex % cols;
                        var oldRow = Math.floor(oldIndex / cols);
                        var oldX = chartX + oldCol * cellWidth;
                        var oldY = chartY + oldRow * cellHeight;

                        // Smooth easing function
                        var t = state.transitionProgress;
                        var eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                        
                        cellX = p.lerp(oldX, targetX, eased);
                        cellY = p.lerp(oldY, targetY, eased);
                        cellOpacity = 255;
                    } else if (state.transitionProgress < 1.0 && oldIndex < 0) {
                        // New resort - fade in
                        cellX = targetX;
                        cellY = targetY;
                        cellOpacity = p.lerp(0, 255, state.transitionProgress);
                    } else {
                        // No transition or transition complete
                        cellX = targetX;
                        cellY = targetY;
                        cellOpacity = 255;
                    }
                    
                    // Check if this sparkline is being hovered (use actual animated position)
                    var isHovered = this.isSparklineHovered(p, cellX, cellY, cellWidth, cellHeight, manager);
                    if (isHovered) {
                        anyCellHovered = true;
                        // Store hovered resort ID for scatter plot highlighting
                        if (manager) {
                            manager.__sparklineHoveredResortId = resort.id || resort.name;
                        }
                    }
                    
                    // Removed scatter plot → sparkline highlighting (user will add different interactivity)

                    // Draw cell background with highlight if hovered
                    p.noStroke();
                    if (isHovered) {
                        // Highlight border and background when hovering over sparkline
                        p.fill(255, 255, 200, cellOpacity * 0.6); // Light yellow background
                        p.rect(cellX, cellY, cellWidth, cellHeight);
                        // Yellow border
                        p.stroke(255, 200, 0, cellOpacity);
                        p.strokeWeight(3);
                        p.noFill();
                        p.rect(cellX, cellY, cellWidth, cellHeight);
                        p.noStroke();
                    } else {
                        p.fill(250, 250, 250, cellOpacity * 0.4);
                    p.rect(cellX, cellY, cellWidth, cellHeight);
                    }

                    // 4. Visual Polish: Resort name above sparkline with text wrapping
                    p.fill(textColor[0], textColor[1], textColor[2], cellOpacity);
                    p.noStroke();
                    p.textAlign(p.LEFT, p.TOP);
                    
                    // Calculate text width and adjust font size or wrap if needed
                    var nameTextSize = fontSizeSmall;
                    var maxNameWidth = cellWidth - 2 * cellPadding - 25; // Leave space for Y-axis
                    p.textSize(nameTextSize);
                    
                    // Measure text width
                    var textWidth = p.textWidth(resort.name);
                    var nameWrapped = false;
                    
                    // If text is too long, reduce font size
                    if (textWidth > maxNameWidth) {
                        nameTextSize = Math.max(7, (maxNameWidth / textWidth) * nameTextSize);
                        p.textSize(nameTextSize);
                        textWidth = p.textWidth(resort.name); // Re-measure with new size
                    }
                    
                    // Wrap text if still too long (split into two lines)
                    var nameY = cellY + cellPadding;
                    var displayName = resort.name;
                    if (textWidth > maxNameWidth && displayName.length > 15) {
                        nameWrapped = true;
                        // Try to split at a space near the middle
                        var midPoint = Math.floor(displayName.length / 2);
                        var splitIndex = displayName.lastIndexOf(' ', midPoint);
                        if (splitIndex === -1) splitIndex = midPoint;
                        
                        var line1 = displayName.substring(0, splitIndex);
                        var line2 = displayName.substring(splitIndex + 1);
                        
                        // Draw first line
                        p.text(line1, cellX + cellPadding, nameY);
                        // Draw second line below
                        p.text(line2, cellX + cellPadding, nameY + nameTextSize + 2);
                        nameY = nameY + nameTextSize + 2; // Adjust for wrapped text
                    } else {
                        p.text(displayName, cellX + cellPadding, nameY);
                    }

                    // Sparkline area - adjust based on whether name wrapped
                    var sparkX = cellX + cellPadding + 25; // Extra space on left for Y-axis labels
                    var nameHeight = nameWrapped ? (nameTextSize * 2 + 4) : (nameTextSize + 5);
                    var sparkY = nameY + nameHeight;
                    var sparkWidth = cellWidth - 2 * cellPadding - 25; // Reduced width for Y-axis space
                    var sparkHeight = cellHeight - nameHeight - 35; // Leave space for name and x-axis labels

                    // Scale functions for sparkline
                    // index should be 0-11 for 12 months (Jan-Dec)
                    var scaleSparkX = function (index) {
                        // Ensure index is within bounds (0 to 11 for 12 months)
                        var clampedIndex = Math.max(0, Math.min(11, index));
                        return sparkX + (clampedIndex / 11) * sparkWidth;
                    };

                    var scaleSparkY = function (snowVal) {
                        // Ensure snowVal is within bounds
                        var clampedSnow = Math.max(0, Math.min(maxSnow, snowVal));
                        return sparkY + sparkHeight - (clampedSnow / maxSnow) * sparkHeight;
                    };
                    
                    // Draw Y-axis tick marks and labels for each sparkline
                    var yAxisOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.4) / 0.6)) * (cellOpacity / 255);
                    if (yAxisOpacity > 0) {
                        var yTicks = 2; // Fewer ticks to avoid clutter
                        for (var tick = 0; tick <= yTicks; tick++) {
                            var tickVal = (tick / yTicks) * maxSnow;
                            var tickY = sparkY + sparkHeight - (tick / yTicks) * sparkHeight;
                            
                            // Draw tick mark
                            p.stroke(axisColor[0], axisColor[1], axisColor[2], yAxisOpacity * 0.4);
                            p.strokeWeight(0.5);
                            p.line(sparkX - 3, tickY, sparkX, tickY);
                            p.noStroke();
                            
                            // Draw value (only show 0 and max to avoid clutter)
                            if (tick === 0 || tick === yTicks) {
                                p.fill(textColor[0], textColor[1], textColor[2], yAxisOpacity * 0.8);
                                p.textAlign(p.RIGHT, p.CENTER);
                                p.textSize(fontSizeSmall - 2);
                                p.text(Math.round(tickVal) + 'cm', sparkX - 5, tickY);
                            }
                        }
                    }

                    // Draw individual X-axis for this sparkline - show labels every 3-4 months
                    var xAxisOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.4) / 0.6)) * (cellOpacity / 255);
                    if (xAxisOpacity > 0) {
                        var xAxisY = sparkY + sparkHeight + 2;
                        
                        // Draw month labels below each sparkline - show every 3 months (Jan, Apr, Jul, Oct)
                        p.fill(textColor[0], textColor[1], textColor[2], xAxisOpacity * 0.7);
                        p.textAlign(p.CENTER, p.TOP);
                        p.textSize(fontSizeSmall - 2);
                        
                        // Show labels every 3 months: Jan (0), Apr (3), Jul (6), Oct (9), and Dec (11)
                        var labelMonths = [0, 3, 6, 9, 11];
                        for (var m = 0; m < labelMonths.length; m++) {
                            var monthIdx = labelMonths[m];
                            var monthX = scaleSparkX(monthIdx);
                            p.text(monthLabels[monthIdx], monthX, xAxisY);
                        }
                        
                        // Draw tick marks for all 12 months (full year scale)
                        p.stroke(axisColor[0], axisColor[1], axisColor[2], xAxisOpacity * 0.3);
                        p.strokeWeight(0.5);
                        for (var m = 0; m < monthLabels.length; m++) {
                            var tickX = scaleSparkX(m);
                            p.line(tickX, sparkY + sparkHeight, tickX, xAxisY);
                        }
                        p.noStroke();
                    }

                    // Draw sparkline with animation
                    if (resort.monthly.length > 0) {
                        // Calculate how many points to show based on progress
                        var pointsToShow = Math.floor(progress * resort.monthly.length);
                        if (pointsToShow < 1 && progress > 0) pointsToShow = 1;

                        // Draw filled area with opacity
                        p.beginShape();
                        p.fill(snowBlue[0], snowBlue[1], snowBlue[2], 120 * (cellOpacity / 255));
                        p.noStroke();
                        
                        // Start at bottom-left
                        p.vertex(sparkX, sparkY + sparkHeight);
                        
                        // Draw line points
                        for (var i = 0; i < pointsToShow; i++) {
                            var point = resort.monthly[i];
                            var x = scaleSparkX(i);
                            var y = scaleSparkY(point.snow);
                            p.vertex(x, y);
                        }
                        
                        // If not all points shown, interpolate to current progress
                        if (pointsToShow < resort.monthly.length && progress > 0) {
                            var partialIndex = progress * (resort.monthly.length - 1);
                            var floorIdx = Math.floor(partialIndex);
                            var ceilIdx = Math.min(floorIdx + 1, resort.monthly.length - 1);
                            var t = partialIndex - floorIdx;
                            
                            var floorSnow = resort.monthly[floorIdx].snow;
                            var ceilSnow = resort.monthly[ceilIdx].snow;
                            var interpSnow = p.lerp(floorSnow, ceilSnow, t);
                            
                            var x = scaleSparkX(partialIndex);
                            var y = scaleSparkY(interpSnow);
                            p.vertex(x, y);
                        }
                        
                        // End at bottom-right - ensure December (index 11) is included
                        var lastIndex = resort.monthly.length - 1;
                        if (lastIndex === 11) {
                            // December is the last month, make sure it's at the right edge
                            var lastX = scaleSparkX(11);
                            p.vertex(lastX, sparkY + sparkHeight);
                        } else {
                            var lastX = scaleSparkX(lastIndex);
                        p.vertex(lastX, sparkY + sparkHeight);
                        }
                        p.endShape(p.CLOSE);

                        // Draw line on top with opacity
                        p.stroke(70, 130, 180, 200 * (cellOpacity / 255));
                        p.strokeWeight(2);
                        p.noFill();
                        p.beginShape();
                        for (var i = 0; i < pointsToShow; i++) {
                            var point = resort.monthly[i];
                            var x = scaleSparkX(i);
                            var y = scaleSparkY(point.snow);
                                p.vertex(x, y);
                        }
                        
                        // Draw partial line if animating
                        if (pointsToShow < resort.monthly.length && progress > 0) {
                            var partialIndex = progress * (resort.monthly.length - 1);
                            var floorIdx = Math.floor(partialIndex);
                            var ceilIdx = Math.min(floorIdx + 1, resort.monthly.length - 1);
                            var t = partialIndex - floorIdx;
                            
                            var floorSnow = resort.monthly[floorIdx].snow;
                            var ceilSnow = resort.monthly[ceilIdx].snow;
                            var interpSnow = p.lerp(floorSnow, ceilSnow, t);
                            
                            var x = scaleSparkX(partialIndex);
                            var y = scaleSparkY(interpSnow);
                            p.vertex(x, y);
                        }
                        // Ensure the last point (December, index 11) is always drawn when we have 12 months
                        if (resort.monthly.length === 12 && pointsToShow >= 12) {
                            var decPoint = resort.monthly[11];
                            if (decPoint) {
                                var decX = scaleSparkX(11);
                                var decY = scaleSparkY(decPoint.snow);
                                p.vertex(decX, decY);
                            }
                        }
                        p.endShape();
                    }
                }
            }

            // Clear sparkline hover if no cell is hovered
            if (!anyCellHovered && manager) {
                manager.__sparklineHoveredResortId = null;
            }

            // Removed shared X-axis - each sparkline now has its own localized x-axis

            // Y-axis label (shared for all sparklines)
            var yAxisOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.4) / 0.6));
            if (yAxisOpacity > 0) {
                // Draw Y-axis title on the left side
                p.push();
                p.translate(chartX - 50, chartY + chartHeight / 2);
                p.rotate(-p.PI / 2);
                p.fill(textColor[0], textColor[1], textColor[2], yAxisOpacity);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(fontSize);
                p.text('Snowfall (cm)', 0, 0);
                p.pop();
            }

            // Draw title (prominent)
            var titleOpacity = p.lerp(0, 255, Math.max(0, progress / 0.3));
            p.fill(textColor[0], textColor[1], textColor[2], titleOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(16);
            p.textStyle(p.BOLD);
            var titleText = 'Monthly Snow Patterns: Top Resorts by Reliability';
            if (state.selectedContinent !== 'All') {
                titleText += ' - ' + state.selectedContinent;
            }
            p.text(titleText, chartX + chartWidth / 2, chartY - 35);
            p.textStyle(p.NORMAL);

            p.pop();
        },

        // Create dropdown filter
        createDropdown: function (p, manager, resortData) {
            var visElement = document.getElementById('vis');
            if (!visElement) return;

            // Check if dropdown already exists
            var existingDropdown = document.getElementById('continent-filter-seasonality');
            if (existingDropdown) {
                // Update position if it exists
                this.updateDropdownPosition(existingDropdown, p);
                return;
            }

            // Get unique continents
            var continents = ['All'];
            var continentSet = {};
            resortData.forEach(function (resort) {
                var continent = resort['Continent'] || 'Unknown';
                if (continent && !continentSet[continent]) {
                    continentSet[continent] = true;
                    continents.push(continent);
                }
            });

            // Create dropdown element
            var dropdown = document.createElement('select');
            dropdown.id = 'continent-filter-seasonality';
            dropdown.style.position = 'absolute';
            // Position relative to canvas - will be updated by updateDropdownPosition
            dropdown.style.zIndex = '1000';
            dropdown.style.padding = '8px 16px';
            dropdown.style.fontSize = '14px';
            dropdown.style.fontFamily = 'Arial, Helvetica, sans-serif';
            dropdown.style.border = '1px solid #ccc';
            dropdown.style.borderRadius = '4px';
            dropdown.style.backgroundColor = '#fff';
            dropdown.style.cursor = 'pointer';
            dropdown.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            // Update position based on canvas
            this.updateDropdownPosition(dropdown, p);

            // Add options
            continents.forEach(function (continent) {
                var option = document.createElement('option');
                option.value = continent;
                option.textContent = continent;
                dropdown.appendChild(option);
            });

            // Add change event listener
            dropdown.addEventListener('change', function () {
                // Reset transition when selection changes
                if (manager.__seasonalityState) {
                    manager.__seasonalityState.transitionProgress = 0;
                    manager.__seasonalityState.transitionFrame = 0;
                }
            });

            // Append to vis container
            visElement.appendChild(dropdown);
        },

        // Get selected continent from dropdown
        getSelectedContinent: function (manager) {
            var dropdown = document.getElementById('continent-filter-seasonality');
            if (dropdown) {
                return dropdown.value || 'All';
            }
            return 'All';
        },

        // Update dropdown position relative to canvas
        updateDropdownPosition: function (dropdown, p) {
            if (!dropdown || !p) return;
            
            // Get canvas element to position relative to it
            var canvas = p.canvas;
            if (canvas) {
                var canvasRect = canvas.getBoundingClientRect();
                var visRect = canvas.parentElement.getBoundingClientRect();
                
                // Position at top center of canvas area
                dropdown.style.top = (canvasRect.top - visRect.top + 20) + 'px';
                dropdown.style.left = (canvasRect.left - visRect.left + canvasRect.width / 2) + 'px';
                dropdown.style.transform = 'translateX(-50%)';
            } else {
                // Fallback positioning
                dropdown.style.top = '20px';
                dropdown.style.left = '50%';
                dropdown.style.transform = 'translateX(-50%)';
            }
        },

        // Show dropdown
        showDropdown: function () {
            var dropdown = document.getElementById('continent-filter-seasonality');
            if (dropdown) {
                dropdown.style.display = 'block';
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '1';
            }
        },

        // Hide dropdown
        hideDropdown: function () {
            var dropdown = document.getElementById('continent-filter-seasonality');
            if (dropdown) {
                dropdown.style.display = 'none';
                dropdown.style.visibility = 'hidden';
                dropdown.style.opacity = '0';
            }
        },

        // Check if a sparkline cell is being hovered
        isSparklineHovered: function (p, cellX, cellY, cellWidth, cellHeight, manager) {
            // Adjust mouse coordinates for canvas position
            var canvas = p.canvas;
            if (!canvas) return false;
            
            var canvasRect = canvas.getBoundingClientRect();
            var mouseX = p.mouseX;
            var mouseY = p.mouseY;
            
            // Check if mouse is within cell bounds
            return (mouseX >= cellX && mouseX <= cellX + cellWidth &&
                    mouseY >= cellY && mouseY <= cellY + cellHeight);
        }
    };
})();
