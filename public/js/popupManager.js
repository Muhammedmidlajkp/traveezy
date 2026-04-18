/**
 * popupManager.js - Enhanced UI notifications
 */
const PopupManager = (() => {
    let popupQueue = [];
    let isPopupActive = false;

    const createModalHTML = (title, message, icon = '📍', options = {}) => {
        const wrapper = document.createElement('div');
        wrapper.id = 'dynamicModal';
        wrapper.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fade-in';
        const showPrimary = options.primaryText || 'Confirm';
        const showSecondary = options.secondaryText || 'Cancel';
        wrapper.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center scale-up shadow-emerald-500/10">
                <div class="text-6xl mb-4 animate-bounce-subtle">${icon}</div>
                <h3 class="text-xl font-bold mb-2 text-gray-900">${title}</h3>
                <p class="text-sm text-gray-500 mb-8 leading-relaxed">${message}</p>
                <div class="flex flex-col gap-3">
                    <button id="modalPrimary" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20">${showPrimary}</button>
                    <button id="modalSecondary" class="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold transition-all">${showSecondary}</button>
                </div>
            </div>
        `;
        return wrapper;
    };

    const showNext = () => {
        if (popupQueue.length === 0 || isPopupActive) return;
        isPopupActive = true;
        const { title, message, icon, options, onConfirm, onCancel } = popupQueue.shift();
        const modal = createModalHTML(title, message, icon, options);
        document.body.appendChild(modal);
        modal.querySelector('#modalPrimary').onclick = () => { if (onConfirm) onConfirm(); modal.remove(); isPopupActive = false; showNext(); };
        modal.querySelector('#modalSecondary').onclick = () => { if (onCancel) onCancel(); modal.remove(); isPopupActive = false; showNext(); };
    };

    return {
        queue: (title, message, icon, onConfirm, onCancel, options = {}) => {
            popupQueue.push({ title, message, icon, options, onConfirm, onCancel });
            showNext();
        },
        showReminder: (name) => PopupManager.queue('Arrival Reminder', `Ready to explore <b>${name}</b>?`, '✨', null, null, { primaryText: 'Got it!' }),
        showCompletionPrompt: (name, onConfirm) => PopupManager.queue('Stop Completed?', `Did you finish your visit at <b>${name}</b>?`, '✅', onConfirm, null, { primaryText: 'Yes, done!', secondaryText: 'Not yet' }),
        showDelayWarning: (name, mins) => PopupManager.queue('Running Late', `You are <b>${mins}m</b> behind at ${name}.`, '⏰', null, null, { primaryText: 'I’m on it' }),
        showSkipSuggestion: (name, onSkip, onContinue) => PopupManager.queue('Smart Suggestion', `Skip <b>${name}</b> to stay on schedule?`, '💡', onSkip, onContinue, { primaryText: 'Skip this stop', secondaryText: 'Continue anyway' })
    };
})();
window.PopupManager = PopupManager;
