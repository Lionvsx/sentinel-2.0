module.exports = {
    isMember
}

function isMember(dBUser) {
    if (dBUser.firstName && dBUser.lastName && dBUser.school && dBUser.isMember && dBUser.isOnNotion) return true;
    else return false;
}
