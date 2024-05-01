#Load Content from the Website
from langchain.document_loaders import WebBaseLoader
from langchain.text_splitter import CharacterTextSplitter
import os
from langchain_cohere import ChatCohere, CohereEmbeddings, CohereRagRetriever
from langchain_community.vectorstores import Chroma
from pprint import pprint
import langchain
langchain.debug = False
from langchain.chains import RetrievalQA
from langchain.llms import Cohere

llm = Cohere(model = "command", temperature=0.3)
cohere_embeddings = CohereEmbeddings()

def loadWebpageDocument(url):
    loader = WebBaseLoader(url)
    doc = loader.load()
    return doc

def createVectorStore(doc):
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    documents = text_splitter.split_documents(doc)
    db = Chroma.from_documents(documents, cohere_embeddings)
    return db


def main(user_query):
    url = "https://docs.cohere.com/docs/cohere-and-langchain#cohere-agents-with-langchain"
    doc = loadWebpageDocument(url)
    db = createVectorStore(doc)

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=db.as_retriever(),
        return_source_documents=True
    )
    
    answer = qa({"query": user_query})
    
    pprint(answer)
    
    
main("how to create web question answering agent with cohere and langchain?")