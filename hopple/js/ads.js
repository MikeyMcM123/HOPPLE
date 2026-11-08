/* Ad inventory only. No network, cookies, provider SDK or tracking is included.
   Complete the README advertising checklist before adding your provider.
   For layout QA: call LadderleAds.setEnabled(true) in the browser console. */
window.LadderleAds = {
  enabled: false,
  setEnabled(enabled) {
    this.enabled = enabled === true;
    document.querySelector('.site-shell').classList.toggle('ads-enabled', this.enabled);
    for (const id of ['ad-sidebar', 'ad-bottom', 'ad-results']) document.getElementById(id).hidden = !this.enabled;
  }
};
