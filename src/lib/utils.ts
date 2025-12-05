function detectOS() {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('win')) {
        return 'Windows';
    } else if (platform.includes('mac')) {
        return 'Mac';
    } else {
        return 'Other';
    }
}

export {detectOS}