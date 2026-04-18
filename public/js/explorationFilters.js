/**
 * explorationFilters.js - Dropdown filtering logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const filters = { category: 'All', activity: 'All', time: 'Any', distance: 'Any' };
    function setupDropdown(btnId, dropdownId, selectedId, key) {
        const btn = document.getElementById(btnId);
        const dropdown = document.getElementById(dropdownId);
        const selected = document.getElementById(selectedId);
        if (!btn || !dropdown || !selected) return;
        btn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('[id^="dropdown-"]').forEach(d => { if (d.id !== dropdownId) d.classList.add('hidden'); });
            dropdown.classList.toggle('hidden');
        };
        dropdown.onclick = (e) => {
            const link = e.target.closest('a[data-value]');
            if (link) {
                filters[key] = link.dataset.value;
                selected.textContent = filters[key];
                dropdown.classList.add('hidden');
            }
        };
    }
    setupDropdown('filter-category-btn', 'dropdown-category', 'selected-category', 'category');
    setupDropdown('filter-activity-btn', 'dropdown-activity', 'selected-activity', 'activity');
    setupDropdown('filter-time-btn', 'dropdown-time', 'selected-time', 'time');
    setupDropdown('filter-distance-btn', 'dropdown-distance', 'selected-distance', 'distance');
    document.onclick = () => document.querySelectorAll('[id^="dropdown-"]').forEach(d => d.classList.add('hidden'));
    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        window.location.href = `${window.location.pathname}?${new URLSearchParams(filters).toString()}`;
    });
});
