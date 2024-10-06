// @ts-ignore
import user1 from '../../assets/user/1.png?asset'
// @ts-ignore
import user2 from '../../assets/user/2.png?asset'
// @ts-ignore
import user3 from '../../assets/user/3.png?asset'
// @ts-ignore
import user4 from '../../assets/user/4.png?asset'
// @ts-ignore
import user5 from '../../assets/user/5.png?asset'
// @ts-ignore
import user6 from '../../assets/user/6.png?asset'
// @ts-ignore
import user7 from '../../assets/user/7.png?asset'

// @ts-ignore
import liked1 from '../../assets/liked/1.png?asset'
// @ts-ignore
import liked2 from '../../assets/liked/2.png?asset'
// @ts-ignore
import liked3 from '../../assets/liked/3.png?asset'
// @ts-ignore
import liked4 from '../../assets/liked/4.png?asset'
// @ts-ignore
import liked5 from '../../assets/liked/5.png?asset'
// @ts-ignore
import liked6 from '../../assets/liked/6.png?asset'
// @ts-ignore
import liked7 from '../../assets/liked/7.png?asset'

// @ts-ignore
import notfound1 from '../../assets/notfound/1.png?asset'
// @ts-ignore
import notfound2 from '../../assets/notfound/2.png?asset'
// @ts-ignore
import notfound3 from '../../assets/notfound/3.png?asset'
// @ts-ignore
import notfound4 from '../../assets/notfound/4.png?asset'
// @ts-ignore
import notfound7 from '../../assets/notfound/7.png?asset'
// @ts-ignore
import notfound5 from '../../assets/notfound/5.png?asset'
// @ts-ignore
import notfound6 from '../../assets/notfound/6.png?asset'

const date = new Date()

export function randomNotFound() {
    return [notfound1, notfound2, notfound3, notfound4, notfound5, notfound6, notfound7][
        date.getDate() % 7
    ]
}

export function randomLiked() {
    return [liked1, liked2, liked3, liked4, liked5, liked6, liked7][date.getDate() % 7]
}

export function randomUser() {
    return [user1, user2, user3, user4, user5, user6, user7][date.getDate() % 7]
}
