const searchText = "allowed shoulod.... asdasdasd"
const world = searchText.trim().split(/\s+/)

const sanitizeEndWord = (word) => {
    return word.replace(/\s\.$/, "");
}
const wordsend = world.join(" ")
console.log(wordsend);
const endwords = sanitizeEndWord(wordsend)
console.log(endwords);
