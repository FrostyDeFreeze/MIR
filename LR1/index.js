const fs = require(`node:fs`)
const readline = require(`node:readline`)
const { performance } = require(`perf_hooks`)
const nodeplotlib = require(`nodeplotlib`)

// Создание интерфейса для чтения ввода с консоли
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

// Функция для запроса ввода пользователя
function ask(query) {
	return new Promise(resolve => rl.question(query, answer => resolve(answer)))
}

// Функция генерации случайной строки
function genRandString(minLen, maxLen) {
	const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen
	const chars = `абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ`
	let result = ``

	for (let i = 0; i < len; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length))
	}

	return result
}

// Функция генерации массива случайных строк
function genRandStringArr(count, minLen, maxLen) {
	const result = []

	for (let i = 0; i < count; i++) {
		result.push(genRandString(minLen, maxLen))
	}

	return result
}

// Функция чтения файла и разделения на массив слов
function readToArr(filePath) {
	try {
		const content = fs.readFileSync(filePath, `utf8`)
		return content.split(/\s+/)
	} catch (e) {
		console.error(`Ошибка чтения файла:`, e)
		return []
	}
}

// Наивный алгоритм поиска (с подсчётом всех совпадений)
function naiveSearch(text, pattern) {
	const textLen = text.length
	const patternLen = pattern.length
	let count = 0

	for (let i = 0; i <= textLen - patternLen; i++) {
		let j = 0

		while (j < patternLen && text[i + j] === pattern[j]) {
			j++
		}

		if (j === patternLen) {
			count++
		}
	}

	return count
}

// Алгоритм Кнута-Морриса-Пратта (КМП) (с подсчётом всех совпадений)
function kmpSearch(text, pattern) {
	const textLen = text.length
	const patternLen = pattern.length
	const lps = computeLPSArr(pattern)
	let i = 0
	let j = 0
	let count = 0

	while (i < textLen) {
		if (pattern[j] === text[i]) {
			i++
			j++
		}

		if (j === patternLen) {
			count++
			j = lps[j - 1]
		} else if (i < textLen && pattern[j] !== text[i]) {
			if (j !== 0) {
				j = lps[j - 1]
			} else {
				i++
			}
		}
	}

	return count
}

// Вспомогательная функция для алгоритма КМП
function computeLPSArr(pattern) {
	const patternLen = pattern.length
	const lps = new Array(patternLen).fill(0)
	let len = 0
	let i = 1

	while (i < patternLen) {
		if (pattern[i] === pattern[len]) {
			len++
			lps[i] = len
			i++
		} else {
			if (len !== 0) {
				len = lps[len - 1]
			} else {
				lps[i] = 0
				i++
			}
		}
	}

	return lps
}

// Функция измерения времени выполнения алгоритма
function measurePerf(fn, textArr, pattern) {
	const start = performance.now()
	let foundCount = 0
	textArr.forEach(text => {
		foundCount += fn(text, pattern)
	})
	const end = performance.now()
	return { time: end - start, foundCount }
}

// Функция создания графика
async function createChart(results) {
	const data = results.datasets.map(dataset => ({
		x: results.sizes,
		y: dataset.data,
		type: `line`,
		name: dataset.label,
		line: { shape: `linear` }
	}))

	const layout = {
		title: `Сравнение времени выполнения алгоритмов`,
		xaxis: { title: `Размер массива` },
		yaxis: { title: `Время выполнения (мс)` }
	}

	nodeplotlib.plot(data, layout)
	await new Promise(resolve => setTimeout(resolve, 500))
}

// Главная логика программы
;(async () => {
	try {
		const minLen = parseInt(await ask(`Введите минимальную длину случайных строк: `)) || 3
		const maxLen = parseInt(await ask(`Введите максимальную длину случайных строк: `)) || 10
		const wordToFind = (await ask(`Введите слово для поиска: `)) || `война`
		const filePath = `./text.txt`
		const sizes = [15_000, 50_000, 100_000, 250_000, 500_000]

		console.log(`\nГенерация случайных строк...`)
		const generatedStrings = sizes.map(size => genRandStringArr(size, minLen, maxLen))

		console.log(`Чтение текста из файла...`)
		const textData = readToArr(filePath)

		const results = {
			sizes: sizes,
			datasets: [
				{ label: `Brute Force (случайные строки)`, data: [] },
				{ label: `KMP (случайные строки)`, data: [] },
				{ label: `Brute Force (слова из файла)`, data: [] },
				{ label: `KMP (слова из файла)`, data: [] }
			]
		}

		for (const [index, size] of sizes.entries()) {
			console.log(`\nТестирование на массиве из ${size} элементов...`)

			const randStringsArr = generatedStrings[index]
			const wordsArr = textData.slice(0, size)

			// Измерение времени для случайных строк
			const randBruteResult = measurePerf(naiveSearch, randStringsArr, wordToFind)
			const randKmpResult = measurePerf(kmpSearch, randStringsArr, wordToFind)

			// Измерение времени для слов из файла
			const wordsBruteResult = measurePerf(naiveSearch, wordsArr, wordToFind)
			const wordsKmpResult = measurePerf(kmpSearch, wordsArr, wordToFind)

			// Вывод результатов в консоль
			console.log(`Brute Force (случайные строки): Время: ${randBruteResult.time.toFixed(3)}мс | Найдено слов: ${randBruteResult.foundCount}`)
			console.log(`KMP (случайные строки): Время: ${randKmpResult.time.toFixed(3)}мс | Найдено слов: ${randKmpResult.foundCount}`)
			console.log(`Brute Force (слова из файла): Время: ${wordsBruteResult.time.toFixed(3)}мс | Найдено слов: ${wordsBruteResult.foundCount}`)
			console.log(`KMP (слова из файла): Время: ${wordsKmpResult.time.toFixed(3)}мс | Найдено слов: ${wordsKmpResult.foundCount}`)

			// Добавление результатов в datasets
			results.datasets[0].data.push(randBruteResult.time)
			results.datasets[1].data.push(randKmpResult.time)
			results.datasets[2].data.push(wordsBruteResult.time)
			results.datasets[3].data.push(wordsKmpResult.time)
		}

		await createChart(results)
	} catch (e) {
		console.error(`Ошибка:`, e)
	} finally {
		rl.close()
	}
})()
