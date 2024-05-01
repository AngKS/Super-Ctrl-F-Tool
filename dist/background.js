
// check if popup is closed

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "popup");
    port.onDisconnect.addListener(function() {

        // send message to content.js to clear highlights
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "clearHighlights"});
        });

        console.log("popup disconnected");

    });
});


// when pop up is opened, fetch the content of the page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'loadContent') {
        console.log('Received loadContent message');

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "loadContent"}, function(response) {
                console.log('Received response from content.js:', response);
                sendResponse(response);
            });
        });

        return true; // Indicate asynchronous response
    }
});
