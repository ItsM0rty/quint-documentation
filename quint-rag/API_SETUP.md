# API Setup Guide

## Quick Start (No API Key Required)

The app now works without any API key! It will provide fallback responses based on your documents.

## For Better AI Responses (Optional)

To get more sophisticated AI-generated answers, you can configure an API key:

### Option 1: DeepSeek (Recommended)
1. Get your API key from: https://platform.deepseek.com/
2. Create a `.env` file in the `quint-rag` folder
3. Add: `DEEPSEEK_API_KEY=your-actual-api-key-here`

### Option 2: OpenAI
1. Get your API key from: https://platform.openai.com/
2. Create a `.env` file in the `quint-rag` folder
3. Add: `OPENAI_API_KEY=your-actual-api-key-here`

### Option 3: Anthropic Claude
1. Get your API key from: https://console.anthropic.com/
2. Create a `.env` file in the `quint-rag` folder
3. Add: `ANTHROPIC_API_KEY=your-actual-api-key-here`

## Example .env file:
```
DEEPSEEK_API_KEY=sk-your-actual-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## Features

- **No API Key Required**: Works out of the box with fallback responses
- **Document Search**: Finds relevant information in your documents
- **Citations**: Shows which documents and pages contain the information
- **Folder Watching**: Automatically indexes new documents
- **Real-time Updates**: Updates as you add/remove documents

The app will automatically detect if you have a valid API key and use it for better responses, otherwise it will use the fallback system. 