const readline = require(`readline`)

// Создание интерфейса для чтения ввода с консоли
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

// Функция для запроса ввода пользователя
function ask(query) {
	return new Promise(resolve => rl.question(query, answer => resolve(answer)))
}

// Функция для разметки слов (добавление символа </w>)
function markWords(words) {
	return words.map(word => word + ` </w>`).join(` `)
}

// Функция для построения частотного словаря биграмм
function getBigrams(wordList) {
	const bigrams = {}

	wordList.forEach(word => {
		const tokens = word.split(` `)

		for (let i = 0; i < tokens.length - 1; i++) {
			const bigram = `${tokens[i]} ${tokens[i + 1]}`

			if (bigrams[bigram]) {
				bigrams[bigram]++
			} else {
				bigrams[bigram] = 1
			}
		}
	})

	return bigrams
}

// Функция для нахождения самой частой биграммы
function getMostFrequentBigram(bigrams) {
	let mostFrequentBigram = null
	let maxFrequency = -1

	for (const [bigram, frequency] of Object.entries(bigrams)) {
		if (frequency > maxFrequency) {
			mostFrequentBigram = bigram
			maxFrequency = frequency
		}
	}

	return mostFrequentBigram
}

// Функция для обновления слов с объединенной биграммой
function mergeBigramInWords(wordList, bigram) {
	if (!bigram) {
		return wordList // Добавлена проверка на случай, если биграмм больше нет
	}

	const [first, second] = bigram.split(` `)
	return wordList.map(word => word.replace(new RegExp(`${first} ${second}`, `g`), `${first}${second}`))
}

// Функция для построения словаря символов с их частотой
function getSymbolFrequencies(wordList) {
	const frequencies = {}

	wordList.forEach(word => {
		const tokens = word.split(` `)

		tokens.forEach(token => {
			if (frequencies[token]) {
				frequencies[token]++
			} else {
				frequencies[token] = 1
			}
		})
	})

	return frequencies
}

// Функция для вывода частот символов и каждой итерации в виде таблицы
function printTable(iteration, symbolFrequencies, bigram, wordList) {
	console.log(`\nИтерация ${iteration}:`)
	console.log(`Частота символов:`)
	console.table(symbolFrequencies)
	if (bigram) {
		console.log(`Выбрана биграмма для объединения: ${bigram}`)
		console.log(`Обновленные слова:`)
		wordList.forEach(word => console.log(word))
	} else {
		console.log(`Биграммы для объединения не найдены.`)
	}
}

// Главная логика программы
; (async () => {
	try {
		// Ввод двух корпусов
		const corpus1 = (await ask(`Введите первый корпус (7 слов через запятую): `)).split(`,`).map(word => word.trim())
		const corpus2 = (await ask(`Введите второй корпус (7 слов через запятую): `)).split(`,`).map(word => word.trim())

		// Разметка корпусов с добавлением </w>
		let wordList1 = markWords(corpus1).split(` `)
		let wordList2 = markWords(corpus2).split(` `)

		// Выполнение 10 итераций BPE для каждого корпуса
		for (let i = 1; i <= 10; i++) {
			// Первый корпус
			let symbolFrequencies1 = getSymbolFrequencies(wordList1)
			let bigrams1 = getBigrams(wordList1)
			let mostFrequentBigram1 = getMostFrequentBigram(bigrams1)
			wordList1 = mergeBigramInWords(wordList1, mostFrequentBigram1)
			printTable(i, symbolFrequencies1, mostFrequentBigram1, wordList1)

			// Второй корпус
			let symbolFrequencies2 = getSymbolFrequencies(wordList2)
			let bigrams2 = getBigrams(wordList2)
			let mostFrequentBigram2 = getMostFrequentBigram(bigrams2)
			wordList2 = mergeBigramInWords(wordList2, mostFrequentBigram2)
			printTable(i, symbolFrequencies2, mostFrequentBigram2, wordList2)
		}
	} catch (e) {
		console.error(`Ошибка:`, e)
	} finally {
		rl.close()
	}
})()
