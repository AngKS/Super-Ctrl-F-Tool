<template>
    <v-card
        flat
        height="100%"
        width="100%"
        color="white"
        rounded="0"
    >   
        
        <v-card-text 
            v-show="queryAnswer.length > 0"
            class="px-0"
        >
            {{ pageContent }}
            <v-list>
                <v-list-item>
                    <v-list-item-title class="font-weight-medium">Parsing...</v-list-item-title>
                    <v-chip>
                        <v-avatar
                            color="transparent"
                            size="25"
                        >
                            <v-img
                                :src="pageFavicon"
                                alt="favicon"
                                height="20"
                                width="20"
                                fit
                            ></v-img>
                        </v-avatar>
                        <v-list-item-title class="font-weight-medium mx-2 text-caption">{{ pageTitle }}</v-list-item-title>
                    </v-chip>
                </v-list-item>
                <v-list-item
                >
                    <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Serch Results</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">{{ page_content }}</v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-card-text>
        <v-card-actions>
            <v-text-field
                v-model="searchQuery"
                variant="outlined"
                hide-details
                placeholder="Find or Ask..."
                clearable
                autofocus
                @keyup.enter="search"
            >
                <template 
                    v-slot:append-inner
                >
                    <v-btn
                        v-show="searchQuery === ''"
                        icon="mdi-close"
                        variant="flat"
                        size="small"
                        class="rounded-lg"
                        @click="closeWindow"
                    ></v-btn>
                    <v-btn
                        v-show="searchQuery !== '' && !searched && !loading"
                        variant="flat"
                        color="blue-darken-3"
                        size="small"
                        @click="search"
                    >Ask</v-btn>
                    <v-list-item-subtitle
                        v-show="searchQuery !== '' && searched && !loading"
                        class="text-subtitle-2 text--secondary font-weight-medium"
                        style="white-space: nowrap;"
                    >{{ wordsFound }} Found</v-list-item-subtitle>
                    <v-progress-circular
                        v-show="loading"
                        size="20"
                        color="blue-darken-3"
                        indeterminate
                    ></v-progress-circular>
                </template>
            </v-text-field>
        </v-card-actions>
    </v-card>
</template>


<script>
export default {
    name: 'ChatWindow',
    props: {
    },
    data() {
        return {
            searchQuery: '',
            searched: false,
            searchTitle: '',
            pageFavicon: '',
            pageTitle: '',
            queryAnswer: [],
            page_content: '',
            wordsFound: 0,
            pageLoaded: false,
            loading: false,
            pageContent: '',
        }
    },
    watch: {
        searchQuery() {
            if (this.searchQuery === '' && this.searched) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'close' });
                });
                this.searched = false;
                this.wordsFound = 0;
                
                return
            }
            else{
                this.search()
            }
        }
    },
    methods: {

        smarterSearch(){},


        search(){
            // 1. fuzzy saerch and highlight the matched text
            console.log("SEARCH!");
            this.loading = true;

            if (this.searchQuery === '') {
                return;
            }

            else if (this.searchQuery !== "" && this.searched){
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (this.pageLoaded){
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'onEnter', word: this.searchQuery }, (response) => {
                        this.loading = false
                        this.searched = true;
                        console.log(response)
                        return
                    });
                } else {
                    this.wait = setTimeout(() => {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'onEnter', word: this.searchQuery }, (response) => {
                            this.loading = false
                            this.searched = true;
                            console.log(response)
                            return
                        });
                    }, 1000);
                }
               
            });
            }


            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (this.pageLoaded){
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', word: this.searchQuery }, (response) => {
                        this.loading = false
                        this.searched = true;
                        console.log(response)
                        this.wordsFound = response.count
                        return
                    });
                } else {
                    this.wait = setTimeout(() => {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', word: this.searchQuery }, (response) => {
                            this.loading = false
                            this.searched = true;
                            console.log(response)
                            this.wordsFound = response.count
                            return
                        });
                    }, 1000);
                }
               
            });
            

        },

        closeWindow(){
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'close' });
            });
            return window.close()
        }

      

    },
    beforeMount() {
        // fetch webpage content
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            // chrome.tabs.sendMessage(tabs[0].id, {action: 'loadContent'}, (response) => {
            //     if (response){
            //         this.pageContent = response.data
            //     }
            //     return
            // })
            
            // message background.js to fetch the page content
            chrome.runtime.sendMessage({ action: 'loadContent' }, (response) => {
                if (response){
                    this.pageContent = response.data
                }
                return
            });


        })


    },
    mounted() {

        // event listener for checkPageLoad
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'checkPageLoad') {
                this.pageLoaded = document.readyState === 'complete';
                sendResponse({ readyState: document.readyState });
            }
        });

        console.log("Page Content:", this.pageContent)
        
    },
    beforeDestroy() {
        clearTimeout(this.wait);
        this.closeWindow()
    },
}
</script>


