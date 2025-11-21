#!/bin/bash

# Setup Firebase Environment Variables

echo "🔧 Setting up Firebase Environment Variables..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "Checking Firebase login status..."
firebase login:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ You are not logged in to Firebase."
    echo "Please run 'firebase login' first."
    exit 1
fi

echo "Select your AI provider:"
echo "1) Google Gemini (Recommended)"
echo "2) OpenAI"
echo "3) Anthropic (Claude)"
read -p "Enter choice [1-3]: " provider_choice

case $provider_choice in
    1)
        read -p "Enter your Google Gemini API Key: " api_key
        if [ -n "$api_key" ]; then
            echo "Setting gemini.key..."
            firebase functions:config:set gemini.key="$api_key"
            echo "✅ Gemini API key set."
        else
            echo "❌ API key cannot be empty."
            exit 1
        fi
        ;;
    2)
        read -p "Enter your OpenAI API Key: " api_key
        if [ -n "$api_key" ]; then
            echo "Setting openai.key..."
            firebase functions:config:set openai.key="$api_key"
            echo "✅ OpenAI API key set."
        else
            echo "❌ API key cannot be empty."
            exit 1
        fi
        ;;
    3)
        read -p "Enter your Anthropic API Key: " api_key
        if [ -n "$api_key" ]; then
            echo "Setting anthropic.key..."
            firebase functions:config:set anthropic.key="$api_key"
            echo "✅ Anthropic API key set."
        else
            echo "❌ API key cannot be empty."
            exit 1
        fi
        ;;
    *)
        echo "❌ Invalid choice."
        exit 1
        ;;
esac

echo ""
echo "🚀 Configuration updated. You must redeploy your functions for changes to take effect:"
echo "   firebase deploy --only functions"
echo ""
read -p "Do you want to deploy functions now? (y/n) " deploy_now
if [[ "$deploy_now" =~ ^[Yy]$ ]]; then
    firebase deploy --only functions
else
    echo "Okay, remember to deploy later!"
fi
