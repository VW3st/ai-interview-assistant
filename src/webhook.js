export const sendToWebhook = async (data) => {
  const webhookUrl = process.env.REACT_APP_WEBHOOK_URL;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text };
    }
  } catch (error) {
    console.error('Failed to send data to webhook:', error);
    throw error;
  }
};

export const sendToApp = async (data) => {
  const appUrl = 'http://127.0.0.1:5000/tr73q56wgb1ejh1vvuqdy6kpoxtrcq9f';  // Ensure this is the correct URL

  try {
    const response = await fetch(appUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text };
    }
  } catch (error) {
    console.error('Failed to send data to app:', error);
    throw error;
  }
};


