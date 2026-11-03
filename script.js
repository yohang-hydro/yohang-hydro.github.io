/* ============================================
   MOBILE NAVIGATION TOGGLE - 移动端导航切换
   ============================================ */

// 等待DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取汉堡菜单按钮和导航菜单元素
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // 汉堡菜单点击事件：切换移动端导航菜单的显示/隐藏
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 点击导航链接时关闭移动端菜单
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));

    /* ============================================
       SMOOTH SCROLLING - 平滑滚动效果
       ============================================ */
    
    // 为所有锚点链接添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // 计算header高度，用于偏移
                const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ============================================
       HEADER SCROLL EFFECT - 头部滚动效果
       ============================================ */
    
    // 添加头部滚动效果：滚动时改变背景透明度和模糊效果
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            // 滚动超过100px时：半透明背景 + 模糊效果
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            // 滚动小于100px时：恢复原始样式
            header.style.backgroundColor = '#fff';
            header.style.backdropFilter = 'none';
        }
    });

    /* ============================================
       PUBLICATION COUNTS - 出版物计数
       ============================================ */
    
    // 统计每一年份的出版物数量（独立于publicationSummary检查）
    const yearLinks = document.querySelectorAll('a[href^="#year-"]');
    yearLinks.forEach(link => {
        const yearId = link.getAttribute('href').substring(1); // 去掉 #
        const yearHeader = document.getElementById(yearId);
        if (yearHeader) {
            // 找到该年份下的所有 citation-item
            const yearGroup = yearHeader.nextElementSibling;
            if (yearGroup && yearGroup.classList.contains('publications-year-group')) {
                const count = yearGroup.querySelectorAll('.citation-item').length;
                // 更新链接文本，例如 "2025 (3)"
                const originalText = link.textContent;
                const yearMatch = originalText.match(/^\d{4}/);
                if (yearMatch) {
                    link.textContent = `${yearMatch[0]} (${count})`;
                }
            }
        }
    });
    
    // 统计出版物数量（仅当在publications页面时执行）
    const publicationSummary = document.getElementById('publication-summary');
    if (publicationSummary) {
        // 只统计期刊出版物（排除会议论文）
        // 找到"Journal Publications"和"Conferences & Talks"之间的出版物
        const journalPublications = document.querySelector('.publications-by-year:not(.conferences-layout)');
        
        let totalPapers = 0;
        let firstAuthorCount = 0;
        const journalCounts = {}; // 用于统计每个期刊的数量
        
        if (journalPublications) {
            // 统计所有期刊出版物的数量
            const citationItems = journalPublications.querySelectorAll('.citation-item');
            totalPapers = citationItems.length;
            
            // 统计第一作者或通讯作者的数量，以及每个期刊的数量
            citationItems.forEach(item => {
                const citationText = item.querySelector('.citation-text');
                if (citationText) {
                    const text = citationText.innerHTML;
                    // 检查是否以 "Zhang, Y." 开头（第一作者）
                    // 或者包含 "Zhang, Y.*"（通讯作者）
                    if (text.trim().startsWith('<span class="author-name">Zhang, Y.</span>') || 
                        text.includes('<span class="author-name">Zhang, Y.<sup>*</sup></span>')) {
                        firstAuthorCount++;
                    }
                    
                    // 提取期刊名称（在 <em> 标签内）
                    const journalMatch = text.match(/<em>([^<]+)<\/em>/);
                    if (journalMatch) {
                        let journalName = journalMatch[1].trim();
                        
                        // 自动替换期刊名称中的 & 为 and（统一样式）
                        journalName = journalName.replace(/&/g, 'and');
                        
                        journalCounts[journalName] = (journalCounts[journalName] || 0) + 1;
                    }
                }
            });
        }
        
        // 更新页面中的数字
        const totalPapersElement = document.getElementById('total-papers');
        const firstAuthorPapersElement = document.getElementById('first-author-papers');
        
        if (totalPapersElement) {
            totalPapersElement.textContent = totalPapers;
        }
        if (firstAuthorPapersElement) {
            firstAuthorPapersElement.textContent = firstAuthorCount;
        }
        
        // 更新期刊列表
         const journalListElement = document.getElementById('journal-list');
         if (journalListElement) {
             // 高影响力期刊在前；组内按论文数量从多到少，数量相同则按名称字母顺序
             const highImpactJournals = new Set([
                'WIREs Water',
                'Geophysical Research Letters',
                'Water Resources Research',
                'Journal of Hydrology',
                'Hydrology and Earth System Sciences',
                'Environmental Modelling and Software',
                'Journal of Hydrometeorology',
                'Science of The Total Environment',
                'Earth and Space Science'
             ]);

             const allJournals = Object.entries(journalCounts)
                 .map(([name, count]) => ({ name, count }))
                 .sort((a, b) => {
                     const aHigh = highImpactJournals.has(a.name) ? 0 : 1;
                     const bHigh = highImpactJournals.has(b.name) ? 0 : 1;
                     if (aHigh !== bHigh) {
                         return aHigh - bHigh;
                     }
                     if (b.count !== a.count) {
                         return b.count - a.count;
                     }
                     return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
                 });
             
             // 格式化并显示
             const formattedJournals = allJournals
                 .map(item => `<em>${item.name}</em> (${item.count})`);
             
             journalListElement.innerHTML = formattedJournals.join(', ') + '.';
         }
    }

    function scholarAxisScale(maxValue) {
        const rough = Math.max(maxValue, 1) / 4;
        const power = 10 ** Math.floor(Math.log10(rough));
        const error = rough / power;
        const step = (error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1) * power;
        const max = Math.ceil(maxValue / step) * step;
        const values = [];
        for (let value = 0; value <= max; value += step) {
            values.push(value);
        }
        return { max, values };
    }

    function scholarSquare(x, y, size, className) {
        const half = size / 2;
        return `<rect class="${className}" x="${(x - half).toFixed(1)}" y="${(y - half).toFixed(1)}" width="${size}" height="${size}"></rect>`;
    }

    function scholarDiamond(x, y, size, className) {
        const half = size / 2;
        return `<polygon class="${className}" points="${x.toFixed(1)},${(y - half).toFixed(1)} ${(x + half).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${(y + half).toFixed(1)} ${(x - half).toFixed(1)},${y.toFixed(1)}"></polygon>`;
    }

    function scholarMonthPosition(date) {
        const [year, month] = String(date).split('-').map(Number);
        return year + (month - 6.5) / 12;
    }

    function scholarSeriesChart(points, series) {
        const width = 700;
        const height = series.showYears ? 148 : 118;
        const pad = { left: 64, right: 22, top: 10, bottom: series.showYears ? 24 : 6 };
        const innerW = width - pad.left - pad.right;
        const innerH = height - pad.top - pad.bottom;
        const snapshots = Array.isArray(series.snapshots) ? series.snapshots : [];
        const plotted = [];
        const yearsWithSnapshots = new Set(snapshots.map(item => Number(String(item.date).slice(0, 4))));
        points.forEach(point => {
            if (yearsWithSnapshots.has(point.year)) {
                return;
            }
            if (point[series.key] !== null) {
                plotted.push({ x: point.year, year: point.year, value: point[series.key] });
            }
        });
        snapshots.forEach(item => {
            const value = Number(item[series.key]);
            if (!Number.isFinite(value)) {
                return;
            }
            plotted.push({
                x: scholarMonthPosition(item.date),
                year: Number(String(item.date).slice(0, 4)),
                value,
            });
        });
        plotted.sort((a, b) => a.x - b.x);
        const values = plotted.map(point => point.value);
        const scale = scholarAxisScale(Math.max(...values, 0));
        const maxX = Math.max(...plotted.map(point => point.x), points[points.length - 1].year);
        const xMin = points[0].year - 0.2;
        const xMax = maxX + 0.2;
        const xAt = position => pad.left + ((position - xMin) / (xMax - xMin)) * innerW;
        const yAt = value => pad.top + innerH - (value / scale.max) * innerH;
        const grid = scale.values.map(value => {
            const y = yAt(value).toFixed(1);
            return `<line class="scholar-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"></line>
                <text class="scholar-tick ${series.tickClass}" x="${pad.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${value}</text>`;
        }).join('');
        const line = plotted
            .map(point => `${xAt(point.x).toFixed(1)},${yAt(point.value).toFixed(1)}`)
            .join(' ');
        const baseline = yAt(0).toFixed(1);
        const area = plotted.length
            ? `${xAt(plotted[0].x).toFixed(1)},${baseline} ${line} ${xAt(plotted[plotted.length - 1].x).toFixed(1)},${baseline}`
            : '';
        const areaClass = series.seriesClass.replace('scholar-series', 'scholar-area');
        const markers = plotted.map(point => {
            const x = xAt(point.x);
            const y = yAt(point.value);
            return `<g class="scholar-point" tabindex="0" data-tip="${point.value}">
                ${series.marker(x, y)}
                <circle class="scholar-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12"></circle>
            </g>`;
        }).join('');
        const years = series.showYears
            ? points.map(point =>
                `<text class="scholar-year" x="${xAt(point.year).toFixed(1)}" y="${height - 4}" text-anchor="middle">${point.year}</text>`
            ).join('')
            : '';
        const midY = pad.top + innerH / 2;
        const label = plotted
            .map(point => `${point.year}: ${point.value} cumulative ${series.name.toLowerCase()}`)
            .join(', ');
        return `<svg class="scholar-line" viewBox="0 0 ${width} ${height}" role="group" aria-label="${label}">
            <polygon class="${areaClass}" points="${area}"></polygon>
            ${grid}
            <text class="scholar-axis ${series.axisClass}" x="16" y="${midY}" text-anchor="middle" transform="rotate(-90 16 ${midY})">${series.name}</text>
            <polyline class="scholar-series ${series.seriesClass}" points="${line}" fill="none"></polyline>
            ${markers}
            ${years}
        </svg>`;
    }

    function scholarTrajectoryCharts(points, snapshots) {
        const citations = scholarSeriesChart(points, {
            key: 'citations',
            name: 'Citations',
            tickClass: 'scholar-tick-citations',
            axisClass: 'scholar-axis-citations',
            seriesClass: 'scholar-series-citations',
            showYears: false,
            snapshots,
            marker: (x, y) => scholarSquare(x, y, 3.5, 'scholar-marker scholar-marker-citations'),
        });
        const publications = scholarSeriesChart(points, {
            key: 'publications',
            name: 'Publications',
            tickClass: 'scholar-tick-publications',
            axisClass: 'scholar-axis-publications',
            seriesClass: 'scholar-series-publications',
            showYears: true,
            snapshots,
            marker: (x, y) => scholarDiamond(x, y, 4.5, 'scholar-marker scholar-marker-publications'),
        });
        return citations + publications;
    }

    function scholarShowTip(chart, point) {
        let tip = chart.querySelector('.scholar-tooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'scholar-tooltip';
            tip.hidden = true;
            chart.appendChild(tip);
        }
        let guide = chart.querySelector('.scholar-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.className = 'scholar-guide';
            guide.hidden = true;
            chart.appendChild(guide);
        }
        const host = chart.getBoundingClientRect();
        const mark = point.getBoundingClientRect();
        const panels = chart.querySelectorAll('.scholar-line');
        const first = panels[0].getBoundingClientRect();
        const last = panels[panels.length - 1].getBoundingClientRect();
        const yearBand = last.height * (24 / 148);
        const center = mark.left + mark.width / 2 - host.left;
        tip.textContent = point.getAttribute('data-tip');
        tip.style.left = `${center}px`;
        tip.style.top = `${mark.top - host.top}px`;
        tip.hidden = false;
        guide.style.left = `${center}px`;
        guide.style.top = `${first.top - host.top}px`;
        guide.style.height = `${last.bottom - yearBand - first.top}px`;
        guide.hidden = false;
    }

    function scholarHideTip(chart, next) {
        if (next && next.closest && next.closest('.scholar-point')) {
            scholarShowTip(chart, next.closest('.scholar-point'));
            return;
        }
        const tip = chart.querySelector('.scholar-tooltip');
        const guide = chart.querySelector('.scholar-guide');
        if (tip) {
            tip.hidden = true;
        }
        if (guide) {
            guide.hidden = true;
        }
    }

    function scholarEnableTips(chart) {
        chart.addEventListener('pointerover', event => {
            const point = event.target.closest('.scholar-point');
            if (point) {
                scholarShowTip(chart, point);
            }
        });
        chart.addEventListener('pointerout', event => {
            if (event.target.closest('.scholar-point')) {
                scholarHideTip(chart, event.relatedTarget);
            }
        });
        chart.addEventListener('focusin', event => {
            const point = event.target.closest('.scholar-point');
            if (point) {
                scholarShowTip(chart, point);
            }
        });
        chart.addEventListener('focusout', event => {
            scholarHideTip(chart, event.relatedTarget);
        });
    }

    const scholarPanel = document.getElementById('scholar-panel');
    if (scholarPanel) {
        fetch('../data/scholar.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Scholar stats are unavailable');
                }
                return response.json();
            })
            .then(data => {
                const citationYears = Array.isArray(data.citationsByYear) ? data.citationsByYear : [];
                const publicationYears = Array.isArray(data.publicationsByYear) ? data.publicationsByYear : [];
                if (citationYears.length === 0 || publicationYears.length === 0) {
                    return;
                }

                const citationCounts = new Map(citationYears.map(item => [Number(item.year), Number(item.citations) || 0]));
                const publicationCounts = new Map(publicationYears.map(item => [Number(item.year), Number(item.publications) || 0]));
                const citationStart = Math.min(...citationCounts.keys());
                const firstYear = Math.min(citationStart, ...publicationCounts.keys());
                const lastYear = Math.max(...citationCounts.keys(), ...publicationCounts.keys());
                let citationTotal = 0;
                let publicationTotal = 0;
                const points = [];
                for (let year = firstYear; year <= lastYear; year += 1) {
                    publicationTotal += publicationCounts.get(year) || 0;
                    const hasCitations = year >= citationStart;
                    if (hasCitations) {
                        citationTotal += citationCounts.get(year) || 0;
                    }
                    points.push({
                        year,
                        citations: hasCitations ? citationTotal : null,
                        publications: publicationTotal,
                    });
                }
                const snapshots = (Array.isArray(data.snapshots) ? data.snapshots : []).filter(item =>
                    /^\d{4}-\d{2}-\d{2}$/.test(String(item.date))
                    && Number.isFinite(Number(item.citations))
                    && Number.isFinite(Number(item.publications))
                );
                const chart = document.getElementById('scholar-chart');
                chart.innerHTML = scholarTrajectoryCharts(points, snapshots);
                scholarEnableTips(chart);

                const updated = String(data.updated || '').split('-');
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const updatedLabel = updated.length === 3
                    ? `${Number(updated[2])} ${months[Number(updated[1]) - 1]} ${updated[0]}`
                    : data.updated;
                document.getElementById('scholar-note').textContent =
                    `Output trajectory, including papers not listed on this page. Update ${updatedLabel}.`;
                scholarPanel.hidden = false;
            })
            .catch(() => {});
    }
});
