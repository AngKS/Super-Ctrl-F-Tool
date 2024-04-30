



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPageLoad') {
        console.log('Received checkPageLoad message');

        chrome.tabs.executeScript(sender.tab.id, { code: 'document.readyState' }, (results) => {
            console.log('Results from executeScript:', results); 
            if (results && results[0]) {
                sendResponse({ readyState: results[0] });
            } else {
                sendResponse({ readyState: 'error' }); 
            }
        });
        return true; // Indicate asynchronous response 


    }
        
    else if (request.action === "loadContent"){
        const document_content = document.body.innerText
        console.log("DOC CONTEN:", document_content)
        return sendResponse({message: "loaded", data: document_content})
    }

    else if (request.action === "highlight"){
        const word = request.word
        console.log("CONTENT", word)
        if (word){
            const regex = new RegExp('(' + word + ')', 'gi')
            clearHighlights()

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
            let currNode = walker.currentNode
            let count = 0
            
            while (currNode){
                if (currNode.nodeType === Node.TEXT_NODE) {
                    const matches = currNode.nodeValue.match(regex);
                    if (matches) {
                        count += matches.length; // Increment count by the number of matches
                        let node = currNode;
                        matches.forEach(match => {
                            const index = node.nodeValue.indexOf(match);
                            if (index > -1) {
                                const before = node.nodeValue.substring(0, index);
                                const after = node.nodeValue.substring(index + match.length);
                                const mark = document.createElement('mark');
                                mark.className = 'highlight';
                                mark.textContent = match;
                
                                node.nodeValue = before;
                                node.parentNode.insertBefore(mark, node.nextSibling);
                                node = document.createTextNode(after);
                                mark.parentNode.insertBefore(node, mark.nextSibling);
                            }
                        });
                        currNode = walker.nextNode();
                    }
                }
                currNode = walker.nextNode()
            }



            return sendResponse({message: "highlighted", count: count})

        }
    }

    else if (request.action === "clearHighlights"){
        console.log("clearing highlights")
        clearHighlights()
        sendResponse({message: "cleared"})
    }

    else if (request.action === "close"){
        // clear all higlihgts
        clearHighlights()

    }

})

function clearHighlights() {
    const highlights = document.querySelectorAll('mark.highlight');
    highlights.forEach(highlight => {
      let parent = highlight.parentNode;
      parent.replaceChild(highlight.firstChild, highlight);
      parent.normalize(); 
    });
  }


