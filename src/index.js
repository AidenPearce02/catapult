let questionButton = document.createElement('div');
questionButton.id = "back";
questionButton.style = "position: absolute; top: 0"

let link = document.createElement('a');
link.href = "/help.html";  
let img = document.createElement('img');
img.src = 'question.svg';
img.width = 32;
img.height = 32;
img.alt = "Back";
img.style = "filter: invert(19%) sepia(34%) saturate(4872%) hue-rotate(258deg) brightness(90%) contrast(85%);";

link.appendChild(img)  

questionButton.appendChild(link);

document.body.appendChild(questionButton);


let creditsButton = document.createElement('div');
creditsButton.id = "back";
creditsButton.style = "position: absolute; top: 0; right: 0"

link = document.createElement('a');
link.href = "/credits.html";  
img = document.createElement('img');
img.src = 'copyright.png';
img.width = 32;
img.height = 32;
img.alt = "Back";
img.style = "filter: invert(19%) sepia(34%) saturate(4872%) hue-rotate(258deg) brightness(90%) contrast(85%);";

link.appendChild(img)  

creditsButton.appendChild(link);

document.body.appendChild(creditsButton);