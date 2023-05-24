// find ~/Dev -name .git -type d >> output.txt
// find ~/BuiltSource -name .git -type d >> output.txt

const fs = require('fs');
const os = require('os');

let hostname = os.hostname();
let reposPath = '';

if (hostname === 'DunbarMBP') {
	reposPath = `${os.homedir}/.config/scripts/repo/personal_repos.txt`;
} else {
	reposPath = `${os.homedir}/.config/scripts/repo/work_repos.txt`;
}

const results = fs.readFileSync(reposPath, 'utf8');

const lines = results
	.split('\n')
	.map((line) => {
		return line.replaceAll('/.git', '');
	})
	.join('\n');

console.log(lines);
