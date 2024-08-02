let storage = {};

export const setItem = (key, value) => {
  storage[key] = value;
};

export const getItem = (key) => {
  return storage[key];
};

export const getAllItems = () => {
  return storage;
};

export const clearStorage = () => {
  storage = {};
};

export const storeResume = (file) => {
  return new Promise((resolve, reject) => {
    console.log('Storing resume:', file);
    if (!(file instanceof File)) {
      console.error('Invalid file object:', file);
      reject(new Error('Invalid file object'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result.split(',')[1];
      storage.resumeContent = base64String;
      storage.resumeName = file.name;
      storage.resumeType = file.type;
      console.log('Resume stored successfully');
      resolve();
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export const getResume = () => {
  return {
    content: storage.resumeContent,
    name: storage.resumeName,
    type: storage.resumeType
  };
};