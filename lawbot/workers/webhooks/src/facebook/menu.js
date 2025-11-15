/**
 * Facebook Messenger Persistent Menu Setup
 * Configure menu, greeting, and get started button
 */
import { MessengerClient } from './client';
/**
 * Setup all Messenger profile settings
 */
export async function setupMessengerProfile(pageAccessToken) {
    const client = new MessengerClient(pageAccessToken);
    try {
        // Set persistent menu
        await setPersistentMenu(client);
        // Set greeting text
        await setGreeting(client);
        // Set get started button
        await setGetStartedButton(client);
        console.log('Messenger profile setup completed successfully');
    }
    catch (error) {
        console.error('Error setting up Messenger profile:', error);
        throw error;
    }
}
/**
 * Setup persistent menu
 */
async function setPersistentMenu(client) {
    const menu = {
        persistent_menu: [
            {
                locale: 'default',
                composer_input_disabled: false,
                call_to_actions: [
                    {
                        title: '🏠 Trang Chủ',
                        type: 'postback',
                        payload: 'GET_STARTED',
                    },
                    {
                        title: '📚 Danh Mục Pháp Luật',
                        type: 'postback',
                        payload: 'LEGAL_CATEGORIES',
                    },
                    {
                        title: '💬 Liên Hệ',
                        type: 'nested',
                        call_to_actions: [
                            {
                                title: '📞 Hotline',
                                type: 'postback',
                                payload: 'CONTACT_HOTLINE',
                            },
                            {
                                title: '🌐 Website',
                                type: 'web_url',
                                url: 'https://lawbot.vn',
                                webview_height_ratio: 'full',
                            },
                            {
                                title: '✉️ Email',
                                type: 'postback',
                                payload: 'CONTACT_EMAIL',
                            },
                        ],
                    },
                ],
            },
            {
                locale: 'vi_VN',
                composer_input_disabled: false,
                call_to_actions: [
                    {
                        title: '🏠 Trang Chủ',
                        type: 'postback',
                        payload: 'GET_STARTED',
                    },
                    {
                        title: '📚 Danh Mục Pháp Luật',
                        type: 'postback',
                        payload: 'LEGAL_CATEGORIES',
                    },
                    {
                        title: '💬 Liên Hệ',
                        type: 'nested',
                        call_to_actions: [
                            {
                                title: '📞 Hotline',
                                type: 'postback',
                                payload: 'CONTACT_HOTLINE',
                            },
                            {
                                title: '🌐 Website',
                                type: 'web_url',
                                url: 'https://lawbot.vn',
                                webview_height_ratio: 'full',
                            },
                            {
                                title: '✉️ Email',
                                type: 'postback',
                                payload: 'CONTACT_EMAIL',
                            },
                        ],
                    },
                ],
            },
        ],
    };
    await client.setMessengerProfile(menu);
    console.log('Persistent menu set successfully');
}
/**
 * Set greeting text
 */
async function setGreeting(client) {
    const greeting = {
        greeting: [
            {
                locale: 'default',
                text: 'Xin chào {{user_first_name}}! 👋 Tôi là trợ lý tư vấn pháp luật AI. Tôi có thể giúp gì cho bạn hôm nay?',
            },
            {
                locale: 'vi_VN',
                text: 'Xin chào {{user_first_name}}! 👋 Tôi là trợ lý tư vấn pháp luật AI. Tôi có thể giúp gì cho bạn hôm nay?',
            },
            {
                locale: 'en_US',
                text: 'Hello {{user_first_name}}! 👋 I am an AI legal assistant. How can I help you today?',
            },
        ],
    };
    await client.setMessengerProfile(greeting);
    console.log('Greeting set successfully');
}
/**
 * Set get started button
 */
async function setGetStartedButton(client) {
    const getStarted = {
        get_started: {
            payload: 'GET_STARTED',
        },
    };
    await client.setMessengerProfile(getStarted);
    console.log('Get started button set successfully');
}
/**
 * Remove persistent menu
 */
export async function removePersistentMenu(pageAccessToken) {
    const client = new MessengerClient(pageAccessToken);
    await client.deleteMessengerProfile([
        'persistent_menu',
        'greeting',
        'get_started',
    ]);
    console.log('Messenger profile removed successfully');
}
/**
 * Update specific menu item
 */
export async function updateMenuLocale(pageAccessToken, locale, menuItems) {
    const client = new MessengerClient(pageAccessToken);
    const menu = {
        persistent_menu: [
            {
                locale,
                composer_input_disabled: false,
                call_to_actions: menuItems,
            },
        ],
    };
    await client.setMessengerProfile(menu);
    console.log(`Menu updated for locale: ${locale}`);
}
