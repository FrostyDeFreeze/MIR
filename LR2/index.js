const fs = require(`node:fs`)
const readline = require(`node:readline`)
const { performance } = require(`perf_hooks`)

// Создание интерфейса для чтения ввода с консоли
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

// Функция для запроса ввода пользователя
function ask(query) {
	return new Promise(resolve => rl.question(query, answer => resolve(answer)))
}

// Функция чтения файла
function readTextFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, `utf8`)
		return content
	} catch (e) {
		console.error(`Ошибка чтения файла:`, e)
		return null
	}
}

// Функция для вычисления расстояния Левенштейна
function levenshteinDistance(str1, str2) {
	const len1 = str1.length
	const len2 = str2.length
	const dp = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0))

	for (let i = 0; i <= len1; i++) dp[i][0] = i
	for (let j = 0; j <= len2; j++) dp[0][j] = j

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1]
			} else {
				dp[i][j] = Math.min(
					dp[i - 1][j] + 1, // Удаление
					dp[i][j - 1] + 1, // Вставка
					dp[i - 1][j - 1] + 1 // Замена
				)
			}
		}
	}

	return dp[len1][len2]
}

// Функция для нечеткого поиска с операциями вставки и замены
function fuzzySearch(text, pattern, maxDist) {
	const textLen = text.length
	const patternLen = pattern.length
	let matches = []

	for (let i = 0; i <= textLen - patternLen; i++) {
		const substring = text.slice(i, i + patternLen)
		const distance = levenshteinDistance(substring, pattern)

		if (distance <= maxDist) {
			matches.push({ position: i, distance, word: substring })
		}
	}

	return matches
}

// Функция для измерения времени выполнения алгоритма
function measurePerf(fn, text, pattern, maxDist) {
	const start = performance.now()
	const result = fn(text, pattern, maxDist)
	const end = performance.now()
	return { time: end - start, foundCount: result.length, matches: result }
}

// Главная логика программы
;(async () => {
	try {
		const pattern = (await ask(`Введите паттерн для поиска: `)) || `война`
		const maxDistance = parseInt(await ask(`Введите максимальное расстояние Левенштейна: `)) || 2
		const filePath = `./text.txt`

		console.log(`Чтение текста из файла...`)
		const textData = readTextFile(filePath)

		console.log(`Запуск нечёткого поиска...`)
		const searchResult = measurePerf(fuzzySearch, textData, pattern, maxDistance)

		searchResult.matches.forEach(match => {
			console.log(`Совпадение на позиции ${match.position} | Расстояние: ${match.distance} | Найденное слово: "${match.word}"`)
		})
		console.log(`Результаты нечёткого поиска: Время: ${searchResult.time.toFixed(3)}мс | Найдено совпадений: ${searchResult.foundCount}`)
	} catch (e) {
		console.error(`Ошибка:`, e)
	} finally {
		rl.close()
	}
})()
