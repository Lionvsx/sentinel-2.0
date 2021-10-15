module.exports = {
    isMember
}

function isMember(dBUser) {
    if (dBUser.firstName && dBUser.lastName && dBUser.school) return true;
    return false;
}
