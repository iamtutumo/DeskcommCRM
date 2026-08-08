import sys

with open('hostgator-setup-kit/comecar.sh', 'r') as f:
    text = f.read()

reps = {
    "Onde o CRM vai rodar?": "Where will the CRM run?",
    "Num servidor de verdade (HostGator/VPS)": "On a real server (HostGator/VPS)",
    "No meu computador (para testar/desenvolver)": "On my computer (for testing/development)",
    "Digite 1 ou 2": "Type 1 or 2",
    "Já comprou o VPS na HostGator?": "Have you bought the VPS?",
    "Não, quero ver a recomendação": "No, I want to see the recommendation",
    "Sim, já tenho acesso e o IP em mãos": "Yes, I already have access and the IP",
    "Para rodar o DeskcommCRM": "To run DeskcommCRM",
    "Passo 1": "Step 1",
    "Abra o terminal e conecte-se ao seu servidor": "Open the terminal and connect to your server",
    "A senha não aparece enquanto você digita": "The password doesn't appear while you type",
    "Cole o comando abaixo lá e aperte Enter": "Paste the command below there and press Enter",
    "O instalador vai assumir a partir daí": "The installer will take over from there",
    "Esse repositório foi feito para rodar em Linux": "This repository is meant to run on Linux",
    "Se você não tem Docker": "If you don't have Docker"
}

for k, v in reps.items():
    text = text.replace(k, v)

with open('hostgator-setup-kit/comecar.sh', 'w') as f:
    f.write(text)

print("Translated comecar.sh.")
