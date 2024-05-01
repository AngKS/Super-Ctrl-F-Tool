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
                <v-list-item
                    v-if="currMode == 'ask' && queryAnswer.length === 0"
                >
                    <v-list-item-title class="font-weight-bold">Parsing...</v-list-item-title>
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
                    v-else
                >
                    <v-list-item-title class="font-weight-bold">{{ queryAnswer[0].question }}</v-list-item-title>
                </v-list-item>
                
                <v-list-item
                >
                    <v-list-item-content>
                        <!-- <v-list-item-title class="font-weight-medium">Search Results</v-list-item-title> -->
                        <p
                            style="max-height: 300px; overflow-y: scroll;"
                            class="text-subtitle-2 font-weight-light"
                        >{{ output }}</p>
                        
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
                        v-if="searchQuery !== '' && searched && !loading && wordsFound === 0"
                        variant="flat"
                        color="blue-darken-3"
                        size="small"
                        @click="smarterSearch()"
                    >Ask</v-btn>
                    <v-list-item-subtitle
                        v-if="searchQuery !== '' && searched && !loading && wordsFound > 0"
                        class="text-subtitle-2 text--secondary font-weight-medium"
                        style="white-space: nowrap;"
                    >{{ wordsFound }} Found</v-list-item-subtitle>
                    <v-progress-circular
                        v-if="loading"
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
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { ChatAnthropic } from "@langchain/anthropic";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BufferMemory } from "langchain/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CohereEmbeddings } from "@langchain/cohere";

export default {
    name: 'ChatWindow',
    props: {
    },
    data() {
        return {
            ANTHROPIC_KEY: "",
            COHERE_KEY: "",
            searchQuery: '',
            searchModes: ['search', 'ask'],
            currMode: 'search',
            searched: false,
            searchTitle: '',
            pageFavicon: '',
            pageTitle: '',
            pageURL: '',
            queryAnswer: [],
            wordsFound: null,
            pageLoaded: false,
            loading: false,
            pageContent: '',
            output: '',
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
        },
    },
    methods: {

        async smarterSearch(){
            this.loading = true;
            this.currMode = 'ask';
            console.log("SMARTER SEARCH!");
            const model = new ChatAnthropic({
                temperature: 0.3,
                streaming: true,
                model: "claude-3-sonnet-20240229",
                apiKey: this.ANTHROPIC_KEY,
            });


            // 1. Document indexing
            const loader = new CheerioWebBaseLoader(this.pageURL)
            console.log("====> 0. Webpage loader created", this.pageURL)
            const docs = await loader.load()
            console.log("====> 1. Webpage loaded")
            // 2. Split texts
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 3000,
                chunkOverlap: 1500,
            })
            const splittedDocs = await splitter.splitDocuments(docs);
            console.log("====> 2. Texts splitted")

            const embeddings = new CohereEmbeddings({
                apiKey: this.COHERE_KEY,
                batchsize: 48
            })

            const vectorStore = await MemoryVectorStore.fromDocuments(
                splittedDocs,
                embeddings,
                {
                    chunkSize: 3000,
                    chunkOverlap: 1500,
                }
            )

            const chain = ConversationalRetrievalQAChain.fromLLM(
                model,
                vectorStore.asRetriever(),
                {
                    returnSourceDocuments: true,
                    memory: new BufferMemory({
                    memoryKey: "chat_history",
                    inputKey: "question",
                    outputKey: "text",
                    returnMessages: true, 
                    }),
                    questionGeneratorChainOptions: {
                    llm: model
                    }
                }
            );

            console.log("====> 5. Chain created")

            console.log("Answer:", docs);

            try {
                const res = await chain.call(
                    {question: this.searchQuery}
                );
                console.log("result", res)
                this.output = res.text;
                this.queryAnswer.push({
                    question: this.searchQuery,
                    answer: this.output,
                    responseObject: res,
                    source: this.pageURL,
                });
                
                

            } catch (e) {
                return `I'm sorry there has been an error: ${e}`
            }
            this.searchQuery = '';
            this.searched = false;
            this.wordsFound = null;
            this.loading = false;
            return
        

            

        },


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
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currTab = tabs[0];
            console.log("Current Tab:", currTab)
            this.pageTitle = currTab.title;
            this.pageURL = currTab.url;
            this.pageFavicon = currTab.favIconUrl
        });
        
    },
    beforeDestroy() {
        clearTimeout(this.wait);
        this.closeWindow()
    },
}
</script>


