if [[ $(HOSTNAME) == "DunbarMBP" ]]; then
    rm -rf $HOME/.config/scripts/repo/personal_repos.txt &&
    find ~/Dev -name .git -type d >> $HOME/.config/scripts/repo/personal_repos.txt
else
    rm -rf $HOME/.config/scripts/repo/work_repos.txt &&
    find ~/Dev -name .git -type d >> $HOME/.config/scripts/repo/work_repos.txt &&
    find ~/BuiltSource -name .git -type d >> $HOME/.config/scripts/repo/work_repos.txt
fi