export const translateText = async (text) => {
    try {
      const response = await fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=vi', {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': '153eb21fba174439be676e55357b8077',
          'Ocp-Apim-Subscription-Region': 'southeastasia',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text: text }]),
      });
  
      const data = await response.json();
      return data[0].translations[0].text;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  };