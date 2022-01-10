let backButton = document.createElement('div');
backButton.id = "back";
backButton.style = "position: absolute; top: 0"

let link = document.createElement('a');
link.href = "/";  
let img = document.createElement('img');
img.src = 'back.svg';
img.width = 32;
img.height = 32;
img.alt = "Back";
img.style = "filter: invert(19%) sepia(34%) saturate(4872%) hue-rotate(258deg) brightness(90%) contrast(85%);";

link.appendChild(img)  

backButton.appendChild(link);

document.body.appendChild(backButton);