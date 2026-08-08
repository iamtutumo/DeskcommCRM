import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

text = text.replace('Escolha (Enter = ${padrao_num}):', 'Choice (Enter = ${padrao_num}):')
text = text.replace('Dica: em qualquer pergunta, digite \'voltar\' para refazer a anterior.', 'Tip: on any question, type \'back\' to redo the previous one.')
text = text.replace('Esse campo é obrigatório. (digite \'voltar\' para refazer a pergunta anterior)', 'This field is required. (type \'back\' to redo the previous question)')

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Done fixing prompts.")
