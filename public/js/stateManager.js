/**
 * stateManager.js - Journey progress and state logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const STATE_KEY = 'journey_progress';
    let progress = JSON.parse(localStorage.getItem(STATE_KEY)) || { completed: [], skipped: [], lastUpdated: Date.now() };
    const journeyItems = [];

    document.querySelectorAll('.journey-item').forEach(el => {
        const timeRange = TimeEngine.extractRange(el.dataset.time || '');
        const item = {
            id: el.id,
            element: el,
            name: el.querySelector('.journey-item__title').textContent.trim(),
            startMinutes: timeRange.start,
            endMinutes: timeRange.end,
            status: 'upcoming',
            popupShown: { reminder: false, delay: false, skip: false, completion: false }
        };
        el.onclick = (e) => {
            if (e.target.closest('.btn-direction')) return;
            if (item.status !== 'completed' && item.status !== 'skipped') {
                PopupManager.showCompletionPrompt(item.name, () => {
                    progress.completed.push(item.id);
                    localStorage.setItem(STATE_KEY, JSON.stringify(progress));
                    updateDisplay();
                });
            }
        };
        journeyItems.push(item);
    });

    const updateDisplay = () => {
        const nowMins = TimeEngine.getMinutesSinceMidnight();
        journeyItems.forEach(item => {
            const isDone = progress.completed.includes(item.id);
            const isSkipped = progress.skipped.includes(item.id);
            let status = 'upcoming';
            if (isDone) status = 'completed';
            else if (isSkipped) status = 'skipped';
            else if (nowMins >= item.startMinutes && nowMins < item.endMinutes) status = 'active';
            else if (nowMins >= item.endMinutes) status = 'pending';

            item.element.className = `journey-item journey-item--${status}`;
            item.status = status;

            const countdown = item.element.querySelector('.journey-item__countdown');
            if (countdown) {
                if (status === 'active') countdown.textContent = `${item.endMinutes - nowMins}m left`;
                else if (status === 'upcoming') {
                    const diff = item.startMinutes - nowMins;
                    if (diff > 0 && diff <= 60) countdown.textContent = `Starts in ${diff}m`;
                }
            }

            // ✅ Automatic completion trigger: 
            // If time is up but not marked done, show popup once
            if (status === 'pending' && !item.popupShown.completion && !isDone && !isSkipped) {
                item.popupShown.completion = true;
                setTimeout(() => {
                    PopupManager.showCompletionPrompt(item.name, () => {
                        progress.completed.push(item.id);
                        localStorage.setItem(STATE_KEY, JSON.stringify(progress));
                        updateDisplay();
                    });
                }, 1000); // Small delay for UX
            }
        });
        const total = journeyItems.length;
        const count = journeyItems.filter(item => item.status === 'completed' || item.status === 'skipped').length;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        const bar = document.getElementById('journey-progress-bar');
        const text = document.getElementById('journey-progress-percent');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.textContent = `${percent}%`;

        updateProgressDot();
    };

    const updateProgressDot = () => {
        const dot = document.getElementById('journey-progress-indicator');
        if (!dot || journeyItems.length === 0) return;

        const nowMins = TimeEngine.getMinutesSinceMidnight();
        const first = journeyItems[0];
        const last = journeyItems[journeyItems.length - 1];

        // Only show if we are within the journey time window
        if (nowMins < first.startMinutes || nowMins > last.endMinutes) {
            dot.style.display = 'none';
            return;
        }

        dot.style.display = 'block';

        // Calculate vertical position
        // We find the two stops the user is currently between
        let activeIndex = journeyItems.findIndex(item => nowMins >= item.startMinutes && nowMins <= item.endMinutes);
        
        if (activeIndex === -1) {
            // We are in a gap between stops
            activeIndex = journeyItems.findIndex((item, i) => {
                const next = journeyItems[i+1];
                return next && nowMins > item.endMinutes && nowMins < next.startMinutes;
            });
        }

        if (activeIndex !== -1) {
            const currentItem = journeyItems[activeIndex];
            const nextItem = journeyItems[activeIndex + 1];
            
            const startEl = currentItem.element.querySelector('.journey-item__dot');
            const startPos = startEl.offsetTop + (startEl.offsetHeight / 2);
            
            if (nextItem) {
                const endEl = nextItem.element.querySelector('.journey-item__dot');
                const endPos = endEl.offsetTop + (endEl.offsetHeight / 2);
                
                // Interpolate position between current dot and next dot
                const segmentStart = currentItem.startMinutes;
                const segmentEnd = nextItem.startMinutes;
                const progress = (nowMins - segmentStart) / (segmentEnd - segmentStart);
                
                const currentTop = startPos + (endPos - startPos) * progress;
                dot.style.top = `${currentTop}px`;
            } else {
                // Last item
                dot.style.top = `${startPos}px`;
            }
        }
    };

    document.getElementById('btn-reset-trip')?.addEventListener('click', () => {
        localStorage.removeItem(STATE_KEY);
        location.reload();
    });

    TimeEngine.startSyncLoop(updateDisplay);
});
