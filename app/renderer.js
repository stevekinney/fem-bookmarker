const { shell, remote } = require('electron');
const { systemPreferences } = remote;

const linksSection = document.querySelector('.links');
const errorMessage = document.querySelector('.message');
const newLinkForm = document.querySelector('.new-link-form');
const newLinkUrl = document.querySelector('.new-link-form--url');
const newLinkSubmit = document.querySelector('.new-link-form--submit');
const clearStorageButton = document.querySelector('.controls--clear-storage');
const linkTemplate = document.querySelector('#link-template');

window.addEventListener('load', () => {
  for (let title of Object.keys(localStorage)) {
    addToPage({ title, url: localStorage.getItem(title) });
  }
  if (systemPreferences.isDarkMode()) {
    document.querySelector('link').href = 'styles-dark.css';
  }
});

const clearForm = () => newLinkUrl.value = null;

const parser = new DOMParser();
const parseResponse = (text) => parser.parseFromString(text, 'text/html');
const findTitle = (nodes) => nodes.querySelector('title').innerText;

const addToPage = ({ title, url }) => {
  const titleElement = linkTemplate.content.querySelector('.link--title');
  const urlElement =  linkTemplate.content.querySelector('.link--url')

  titleElement.textContent = title;
  urlElement.href = url;
  urlElement.textContent = url;

  linksSection.appendChild(linkTemplate.content.cloneNode(true));
  return { title, url };
};

const validateResponse = (response) => {
  if (response.ok) { return response; }
  throw new Error(`Received a status code of ${response.status}`);
}

const storeLink = ({ title, url }) => {
  localStorage.setItem(title, url);
  return { title, url };
};

newLinkUrl.addEventListener('keyup', () => {
  newLinkSubmit.disabled = !newLinkUrl.validity.valid;
});

newLinkForm.addEventListener('submit', (event) => {
  event.preventDefault();
  errorMessage.textContent = null;

  const url = newLinkUrl.value;

  fetch(url)
    .then(validateResponse)
    .then(response => response.text())
    .then(parseResponse)
    .then(findTitle)
    .then(title => ({ title, url }))
    .then(addToPage)
    .then(storeLink)
    .then(clearForm)
    .catch(error => {
      console.error(error);
      errorMessage.textContent = `There was an error fetching "${url}" (${error.message}).`;
    });
});

clearStorageButton.addEventListener('click', () => {
  localStorage.clear();
  linksSection.innerHTML = '';
});

linksSection.addEventListener('click', (event) => {
  if (event.target.href) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});
