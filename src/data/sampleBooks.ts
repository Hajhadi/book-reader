export interface SampleBookItem {
  id: string;
  title: string;
  persianTitle?: string;
  author: string;
  persianAuthor?: string;
  genre: string;
  persianGenre?: string;
  mood: string;
  description: string;
  wordCount: number;
  expectedEpisodes: number;
  recommendedVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir' | 'Charon';
  text: string;
  persianText: string;
}

export const SAMPLE_BOOKS: SampleBookItem[] = [
  {
    id: 'time-machine',
    title: 'The Time Machine',
    persianTitle: 'ماشین زمان',
    author: 'H. G. Wells',
    persianAuthor: 'هربرت جورج ولز',
    genre: 'Classic Science Fiction & Philosophical Mystery',
    persianGenre: 'علمی-تخیلی کلاسیک و فلسفی',
    mood: 'Introspective, speculative, intellectually thrilling',
    description: 'The Time Traveller explains the fourth dimension to skeptical Victorian gentlemen before demonstrating his miniature temporal apparatus.',
    wordCount: 3820,
    expectedEpisodes: 3,
    recommendedVoice: 'Zephyr',
    text: `CHAPTER I: THE FOURTH DIMENSION

The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon; and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision. And he put it to us in this way—marking the points with a lean forefinger—as we sat and lazily admired his earnestness over this new paradox (as we thought it) and his fecundity.

"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception."

"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.

"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."

"That is all right," said the Psychologist.

"Nor, having only length, breadth, and thickness, can a cube have a real existence."

"There I object," said Filby. "Of course a solid body may exist. All real things—"

"So most people think. But wait a moment. Can an instantaneous cube exist?"

"Don't follow you," said Filby.

"Can a cube that does not last for any time at all, have a real existence?"

Filby became pensive. "Clearly," the Time Traveller proceeded, "any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration. But through a natural infirmity of the flesh, which I will explain to you in a moment, we incline to overlook this fact. There are really four dimensions, three which we call the three planes of Space, and a fourth, Time. There is, however, a tendency to draw an unreal distinction between the former three dimensions and the latter, because it happens that our consciousness moves intermittently along the latter from the beginning to the end of our lives."

"That," said a very young man, making spasmodic efforts to relight his cigar over the lamp; "that . . . very clear indeed."

"Now, it is very remarkable that this is so extensively overlooked," continued the Time Traveller, with a slight accession of cheerfulness. "Really this is what is meant by the Fourth Dimension, though some people who talk about the Fourth Dimension do not know they mean it. It is only another way of looking at Time. There is no difference between Time and any of the three dimensions of Space except that our consciousness moves along it. Well, some foolish people have got hold of the wrong side of that idea. You have all heard what they have to say about this Fourth Dimension?"

"I have not," said the Provincial Mayor.

"It is simply this. That Space, as our mathematicians have it, is spoken of as having three dimensions, which one may call Length, Breadth, and Thickness, and is always definable by reference to three planes, each at right angles to the others. But some philosophical people have been asking why three dimensions particularly—why not another direction at right angles to the other three?—and have even tried to construct a Four-Dimension geometry. Professor Simon Newcomb was expounding this to the New York Mathematical Society only a month or so ago. You know how on a flat surface, which has only two dimensions, we can represent a figure of a three-dimensional solid, and similarly they think that by models of three dimensions they could represent one of four—if they could master the perspective of the thing. See?"

"I think so," murmured the Provincial Mayor; and, knitting his brows, he lapsed into an introspective state, his lips moving as one who repeats mystic words. "Yes, I think I see it now," he said after some time, brightening in a quite transient manner.

"Well, I do not mind telling you I have been at work upon this geometry of Four Dimensions for some time. Some of my results are curious. For instance, here is a portrait of a man at eight years old, another at fifteen, another at seventeen, another at twenty-three, and so on. All these are evidently sections, as it were, Three-Dimensional representations of his Four-Dimensioned being, which is a fixed and unalterable thing."

"Scientific people," proceeded the Time Traveller, after the pause required for the proper assimilation of this, "know very well that Time is only a kind of Space. Here is a popular scientific diagram, a weather record. This line I trace with my finger shows the movement of the barometer. Yesterday it was so high, yesterday night it fell, then this morning it rose again, and so gently upward to here. Surely the mercury did not trace this line in any of the dimensions of Space generally recognized? But certainly it traced such a line, and that line, therefore, we must conclude was along the Time-Dimension."

"But," said the Medical Man, staring hard at a coal in the fire, "if Time is really only a fourth dimension of Space, why is it, and why has it always been, regarded as something different? And why cannot we move in Time as we move about in the other dimensions of Space?"

The Time Traveller smiled. "Are you so sure we can move freely in Space? Right and left we can go, backward and forward freely enough, and men always have done so. I admit we move freely in two dimensions. But how about up and down? Gravitation limits us there."

"Not exactly," said the Medical Man. "There are balloons."

"But before the balloons, save for spasmodic jumping and the gravitation of uneven ground, man had no freedom of vertical movement."

"Still they could move a little up and down," said the Medical Man.

"Easier, far easier down than up."

"And you cannot move at all in Time, you cannot get away from the present moment."

"My dear sir, that is just where you are wrong. That is just where the whole world has gone wrong. We are always getting away from the present moment. Our mental existences, which are immaterial and have no dimensions, are passing along the Time-Dimension at a uniform velocity from the cradle to the grave. Just as we should travel down if we began our existence fifty miles above the earth's surface."

"But the great difficulty is this," said the Psychologist. "You can move about in all directions of Space, but you cannot move about in Time."

"That is the germ of my great discovery. But you are wrong to say that we cannot move about in Time. For instance, if I am recalling an incident very vividly I go back to the instant of its occurrence: I become absent-minded, as you say. I jump back for a moment. Of course we have no means of staying back for any length of Time, any more than a man has of staying up in the air six feet above the ground. But a civilized man is better off than the savage in this respect. He can go up against gravitation in a balloon, and why should he not hope that ultimately he may be able to stop or accelerate his drift along the Time-Dimension, or even turn about and travel the other way?"

"Oh, this, began Filby, is all—"

"Why not?" said the Time Traveller.

"It's against reason," said Filby.

"What reason?" said the Time Traveller.


CHAPTER II: THE APPARATUS AND THE EXPERIMENT

The Time Traveller smiled round at us. Then, still smiling faintly, and with his hands deep in his trousers pockets, he walked slowly out of the room, and we heard his slippers shuffling down the long passage to his laboratory.

The Psychologist looked at us. "I wonder what he's got?"

"Some sleight-of-hand trick or other," said the Medical Man, and Filby tried to tell us about a conjuror he had seen at Burslem; but before he had finished his preface the Time Traveller came back, and Filby's anecdote collapsed.

The thing the Time Traveller held in his hand was a glittering metallic framework, scarcely larger than a small clock, and very delicately made. There was ivory in it, and some transparent crystalline substance. And now I must be explicit, for this that follows—unless his explanation is to be accepted—is an absolutely unaccountable thing. He took one of the small octagonal tables that were scattered about the room, and set it in front of the fire, with two legs on the hearthrug. On this table he placed the mechanism. Then he drew up a chair, and sat down. The only other object on the table was a small brass lamp, the light of which fell full upon the model. There were also perhaps a dozen candles about, two in brass candlesticks upon the mantel and several in sconces, so that the room was brilliantly illuminated. I sat in a low armchair nearest the fire, and I drew this forward so as to be almost between the Time Traveller and the fireplace. Filby sat behind him, looking over his shoulder. The Medical Man and the Provincial Mayor watched him in profile from the right, the Psychologist from the left. The Very Young Man stood behind the Psychologist. We were all on the alert. It appeared incredible to me that any kind of trick, however subtly conceived and however adroitly done, could have been played upon us under these conditions.

The Time Traveller looked at us, and then at the mechanism. "Well?" said the Psychologist.

"This little affair," said the Time Traveller, resting his elbows upon the table and pressing his hands together above the apparatus, "is only a model. It is my plan for a machine to travel through time. You will notice that it looks singularly askew, and that there is an odd twinkling appearance about this bar, as though it were in some way unreal." He pointed to the part with his finger. "Also, here is one little white lever, and here is another."

The Medical Man got up out of his chair and peered into the thing. "It's beautifully made," he said.

"It took two years to make," retorted the Time Traveller. Then, when we had all imitated the Medical Man, he said: "Now I want you clearly to understand that this lever, being pressed over, sends the machine gliding into the future, and this other reverses the motion. This saddle represents the seat of a time traveller. Presently I am going to press the lever, and off the machine will go. It will vanish, pass into future Time, and disappear. Have a good look at the thing. Look at the table too, and satisfy yourselves there is no trickery. I don't want to waste this model, and then be told I'm a quack."

There was a minute's pause perhaps. The Psychologist seemed about to speak to me, but turned to the mechanism again. Then the Time Traveller put forth his finger towards the lever. "No," he said suddenly. "Lend me your hand." And turning to the Psychologist, he took that individual's hand in his own and told him to put out his forefinger. So that it was the Psychologist himself who sent the model Time Machine on its interminable voyage. We all saw the lever turn. I am absolutely certain there was no trickery. There was a breath of wind, and the lamp flame jumped. One of the candles on the mantel was blown out, and the little machine suddenly swung round, became indistinct, was seen as a ghost for a second perhaps, as an eddy of faintly glittering brass and ivory; and it was gone—vanished! Save for the lamp the table was bare.

Everyone was silent for a minute. Then Filby said he was damned.

The Psychologist recovered from his stupor, and suddenly looked under the table. At that the Time Traveller laughed cheerfully. "Well?" he said, with a reminiscence of the Psychologist. Then, getting up, he went to the tobacco-jar on the mantel, and with his back to us began to fill his pipe.

We stared at each other. "Look here," said the Medical Man, "are you in earnest about this? Do you seriously believe that that machine has travelled into time?"

"Certainly," said the Time Traveller, stooping to light a spill at the fire. Then he turned, lighting his pipe, to look at the Psychologist's face. (The Psychologist, to show that he was not unhinged, helped himself to a cigar and tried to light it unmended.) "What is more, I have a big machine nearly finished in there"—he indicated the laboratory—"and when that is put together I mean to have a journey on my own account."

"You mean to say that that machine has travelled into the future?" said Filby.

"Into the future or the past—I don't, for certain, know which."

After an interval the Psychologist had an inspiration. "It must have gone into the past if it has gone anywhere," he said.

"Why?" said the Time Traveller.

"Because I presume that it has not moved in space, and if it travelled into the future it would still be here all this time, since it must have travelled through this time."

"But," said I, "if it travelled into the past it would have been visible when we first came into this room; and last Thursday when we were here; and the Thursday before that; and so forth!"

"Serious objections," remarked the Provincial Mayor, with an air of impartiality, turning towards the Time Traveller.

"Not a bit," said the Time Traveller, and, to the Psychologist: "You think. You can explain that. It's presentation below the threshold, you know, diluted presentation."

"Of course," said the Psychologist, and reassured us. "That's a simple point of psychology. I should have thought of it. It's plain enough, and helps the paradox delightfully. We cannot see it, nor can we appreciate this machine, any more than we can see the spoke of a wheel spinning, or a bullet flying through the air. If it is travelling through time fifty times or a hundred times faster than we are, if it gets through a minute while we get through a second, the impression it creates will of course be only one-fiftieth or one-hundredth of what it would make if it were not travelling in time. That's plain enough." He passed his hand through the space in which the machine had been. "You see?" he said, laughing.

We sat and stared at the vacant table for a minute. Then the Time Traveller asked us what we thought of it all.

"It sounds plausible enough to-night," said the Medical Man; "but wait until to-morrow. Wait for the common sense of the morning."


CHAPTER III: THE FULL-SCALE MACHINE IN THE SHADOWS

"Would you like to see the big machine itself?" asked the Time Traveller. And therewith, taking up the lamp, he led the way down the long, draughty corridor to his workshop. I remember vividly the flickering light, his grotesque head in shadow against the whitewashed wall, and the smell of methylated spirits and burning oil.

On the workbench stood a framework of nickel, brass, and carved ivory, about the size of a small carriage, with bars of transparent rock crystal and a saddle upholstered in dark green morocco leather. It was almost finished. There were parts still to be fitted, and a pile of filings lay upon the bench beneath the lathe.

I took up one of the crystal rods. "Does this machine truly move?" I asked, looking into its refractive clarity.

"It moves," he answered quietly. "Not as an engine moves upon rails, but across the unseen dimension. Before another week has passed, I will sit upon that saddle, press this forward lever, and watch the centuries stream past like autumn leaves in a hurricane."

Filby cleared his throat, but said nothing. For once, the argumentative red-haired man had run out of disputations. The silence in the laboratory was profound, broken only by the steady hiss of the gas-jet and the distant murmur of London streets beyond the shuttered windows.

"Tomorrow night," the Time Traveller whispered, his hand resting upon the nickel rail of the vehicle. "You will return here for dinner. And I shall either be here to meet you with stories beyond the wildest fables of mankind, or my seat at the table will be empty."`,
    persianText: `فصل اول: بُعد چهارم

مسافر زمان در حال شرح مسئله‌ای بسیار عمیق برای ما بود. چشمان خاکستری‌اش می‌درخشید و چهره‌اش که معمولاً رنگ‌پریده بود، برافروخته و سرشار از شور بود. آتش شومینه به روشنی می‌سوخت، و تابش ملایم چراغ‌های رشته‌ای، حباب‌هایی را که در گیلاس‌هایمان برق می‌زدند در بر می‌گرفت. صندلی‌هایمان، که از اختراعات ثبت‌شده خود او بود، ما را در آغوش می‌کشیدند؛ و آن فضای دلپذیر و تجملاتیِ پس از شام حاکم بود، زمانی که اندیشه‌ها با آرامش به پرواز درمی‌آیند. و او این موضوع را به این صورت برای ما بازگو می‌کرد—نکات کلیدی را با انگشت اشاره باریکش علامت می‌زد—در حالی که ما نشسته بودیم و جدیت و ذکاوت بی‌نظیر او را در شرح این پارادوکس تازه تحسین می‌کردیم.

«شما باید با دقت تمام به حرف‌های من توجه کنید. من ناچارم یک یا دو مفهومی را که همگان پذیرفته‌اند، به چالش بکشم. برای نمونه، هندسه‌ای که در مدرسه آموخته‌اید بر پایه‌ی یک سوءتفاهم بنیادین استوار است.»

فیلبی، مردی اهل مجادله با موهای سرخ، گفت: «آیا فکر نمی‌کنی این کار برای شروع، انتظاری بسیار بزرگ از ما باشد؟»

«قصد ندارم از شما بخواهم چیزی را بدون دلیلی منطقی بپذیرید. به زودی خودتان اعتراف خواهید کرد. شما می‌دانید که یک خط ریاضی با ضخامت صفر، هیچ وجود خارجی ندارد. یک صفحه ریاضی نیز وجود ندارد. این‌ها تنها تجریدهای ذهنی ما هستند.»

روان‌شناس گفت: «این نکته کاملاً درست است.»

«همچنین، یک مکعب، تنها با داشتن طول، عرض و ضخامت، هرگز نمی‌تواند وجود واقعی داشته باشد.»

فیلبی معترض شد: «البته که یک جسم صلب می‌تواند وجود داشته باشد.»

«بیشتر مردم همین‌گونه فکر می‌کنند. اما لحظه‌ای درنگ کن. آیا یک مکعبِ آنی و بی‌درنگ، می‌تواند وجود داشته باشد؟ آیا مکعبی که برای هیچ مدتی از زمان دوام نیاورد، می‌تواند وجود واقعی داشته باشد؟»

فیلبی به فکر فرو رفت. مسافر زمان ادامه داد: «بدیهی است که هر جسم واقعی باید در چهار جهت گسترش داشته باشد: طول، عرض، ضخامت و—مدت زمان. اما به خاطر یک ضعف طبیعی در کالبد بشری، ما تمایل داریم این حقیقت را نادیده بگیریم. در واقع چهار بُعد وجود دارد: سه بُعد فضا، و بُعد چهارم یعنی زمان. با این حال، گرایشی وجود دارد که تمایزی ساختگی میان فضا و زمان ترسیم کند، تنها به این دلیل که آگاهی ما از بدو تولد تا لحظه مرگ، در طول بعد زمان حرکت می‌کند.»

مرد جوانی که می‌کوشید سیگار برگش را روشن کند گفت: «این نکته بسیار روشن و بدیهی است.»

مسافر زمان با گشاده‌رویی ادامه داد: «بعد چهارم تنها زاویه‌ای دیگر برای نگریستن به زمان است. هیچ تفاوتی میان زمان و ابعاد فضا وجود ندارد، جز اینکه آگاهی ما در راستای آن به پیش می‌رود. دانشمندان به خوبی می‌دانند که زمان در حقیقت تنها گونه‌ای از فضاست. این خطی که با انگشتم دنبال می‌کنم، تغییرات فشارسنج را نشان می‌دهد. مطمئناً این خط در ابعاد فضایی رسم نشده، بلکه در امتداد بعد زمان کشیده شده است.»

پزشک گفت: «اگر زمان واقعاً بعد چهارم فضاست، چرا ما نمی‌توانیم در زمان حرکت کنیم همان‌گونه که در سایر ابعاد فضا جابه‌جا می‌شویم؟»

مسافر زمان لبخند زد: «آیا شما چندان مطمئنید که ما آزادانه در فضا حرکت می‌کنیم؟ ما در دو بعد حرکت می‌کنیم، اما جاذبه ما را در بعد سوم محدود کرده است. و در مورد زمان، وجود ما همواره از گذشته به آینده جریان دارد. اما چرا نباید امیدوار باشیم که روزی بتوانیم سرعت حرکت خود در زمان را کنترل کنیم یا حتی به گذشته بازگردیم؟»


فصل دوم: دستگاه و آزمایش شگفت‌انگیز

مسافر زمان لبخندی به ما زد و به آرامی به سوی آزمایشگاهش رفت. لحظاتی بعد با چارچوبی فلزی و درخشان بازگشت که از یک ساعت رومیزی بزرگ‌تر نبود و از برنج، عاج و بلور شفاف ساخته شده بود.

او دستگاه را روی میز هشت‌ضلعی در برابر آتش گذاشت و گفت: «این مدل نقشه من برای ماشینی است که در زمان سفر کند. این اهرم کوچک، ماشین را به آینده می‌فرستد و اهرم دیگر جهت حرکت را معکوس می‌کند. اکنون می‌خواهم اهرم را فشار دهم تا به سوی آینده حرکت کند و ناپدید شود.»

سکوت سنگینی بر اتاق سایه افکند. ناگهان مسافر زمان دست روان‌شناس را گرفت و از او خواست اهرم را فشار دهد. همه ما دیدیم که اهرم چرخید. نسیمی وزید، شعله چراغ جهید، و آن ماشین کوچک ناگهان همچون شبحی مه‌آلود چرخید و در یک چشم بر هم زدن ناپدید شد! روی میز به جز چراغ هیچ چیزی نبود.

همه مبهوت ماندند. پزشک با ناباوری پرسید: «آیا واقعاً باور داری که آن دستگاه در زمان سفر کرده است؟»

مسافر زمان با اطمینان گفت: «کاملاً مطمئنم. علاوه بر این، من ماشینی در اندازه واقعی در کارگاه خود دارم که تقریباً آماده سفر من است.»


فصل سوم: ماشین عظیم در کارگاه

مسافر زمان چراغ را برداشت و ما را به کارگاه هدایت کرد. روی میز کار، سازه‌ای عظیم از نیکل، برنج و عاج قرار داشت، با میله‌هایی از بلور کوارتز شفاف و زینی پوشیده از چرم سبز تیره.

پرسیدم: «آیا این ماشین واقعاً در زمان حرکت می‌کند؟»

او آرام پاسخ داد: «حرکت می‌کند. پیش از آنکه هفته‌ای بگذرد، من بر این زین خواهم نشست، این اهرم را فشار خواهم داد و گذر قرن‌ها را نظاره خواهم کرد. فردا شب به اینجا بیایید؛ یا با شگفت‌انگیزترین داستان‌های تاریخ بشر به پیشوازتان خواهم آمد، یا صندلی من تا ابد خالی خواهد ماند.»`,
  },
  {
    id: 'dorian-gray',
    title: 'The Picture of Dorian Gray',
    persianTitle: 'تصویر دوریان گری',
    author: 'Oscar Wilde',
    persianAuthor: 'اسکار وایلد',
    genre: 'Victorian Gothic Drama & Aesthetic Philosophy',
    persianGenre: 'درام گوتیک و فلسفه زیبایی‌شناسی',
    mood: 'Decadent, sensual, philosophical, haunting',
    description: 'In the perfumed studio of Basil Hallward, Lord Henry Wotton first observes the portrait of the exquisitely beautiful Dorian Gray.',
    wordCount: 2950,
    expectedEpisodes: 2,
    recommendedVoice: 'Kore',
    text: `CHAPTER I: THE STUDIO AND THE PORTRAIT

The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.

From the corner of the divan of Persian saddle-bags on which he was lying, smoking, as was his custom, innumerable cigarettes, Lord Henry Wotton could just catch the gleam of the honey-sweet and honey-coloured blossoms of a laburnum, whose tremulous branches seemed hardly able to bear the weight of a beauty so flame-like as their own; and now and then the fantastic shadows of birds in flight flitted across the long tussore-silk curtains that were stretched in front of the huge window, producing a kind of momentary Japanese effect, and making him think of those pallid, jade-faced painters of Tokyo who, through the medium of an art that is necessarily immobile, seek to convey the sense of swiftness and motion. The sullen murmur of the bees shouldering their way through the long unmown grass, or circling with monotonous insistence round the dusty gilt horns of the straggling woodbine, seemed to make the stillness more oppressive. The dim roar of London was like the bourdon note of a distant organ.

In the centre of the room, clamped to an upright easel, stood the full-length portrait of a young man of extraordinary personal beauty, and in front of it, some little distance away, was sitting the artist himself, Basil Hallward, whose sudden disappearance some years ago caused, at the time, such public excitement and gave rise to so many strange conjectures.

As the painter looked at the gracious and comely form he had so skilfully mirrored in his art, a smile of pleasure passed across his face, and seemed about to linger there. But he suddenly started up, and closing his eyes, placed his fingers upon the lids, as though he sought to imprison within his brain some curious dream from which he feared he might awake.

"It is your best work, Basil, the best thing you have ever done," said Lord Henry languidly. "You must certainly send it next year to the Grosvenor. The Academy is too large and too vulgar. Whenever I have gone there, there have been either so many people that I have not been able to see the pictures, which was dreadful, or so many pictures that I have not been able to see the people, which was even worse. The Grosvenor is really the only place."

"I don't think I shall send it anywhere," he answered, tossing his head back in that odd way that used to make his friends laugh at him at Oxford. "No, I shall not send it anywhere."

Lord Henry elevated his eyebrows and looked at him in amazement through the thin blue wreaths of smoke that curled up in such whimsical whorls from his heavy, opium-tainted cigarette. "Not send it anywhere? My dear fellow, why? Have you any reason? What odd chaps you painters are! You do anything in the world to gain a reputation. As soon as you have one, you seem to want to throw it away. It is silly of you, for there is only one thing in the world worse than being talked about, and that is not being talked about. A portrait like this would set you far above all the young men in England, and make the old men quite jealous, if old men are ever capable of any emotion."

"I know you will laugh at me," Basil replied, "but I really cannot exhibit it. I have put too much of myself into it."`,
    persianText: `فصل اول: کارگاه نقاشی و تصویر دوریان

کارگاه نقاشی آکنده از بوی سرمست‌کننده گل‌های سرخ بود، و آنگاه که نسیم سبکبال تابستانی در میان درختان باغ می‌وزید، از میان درگاه باز، عطر سنگین یاس‌های بنفش به درون روانه می‌شد.

لرد هنری واتون بر روی دیوانی پوشیده از خورجین‌های زینی ایرانی آرمیده بود و پی‌درپی سیگار دود می‌کرد. از پنجره بزرگ کارگاه، شکوفه‌های زرین درختان دیده می‌شد و سایه پرندگان در پرواز بر پرده‌های ابریشمین می‌گذشت. در میانه اتاق، بر روی سه‌پایه نقاشی، تصویر تمام‌قدی از مرد جوانی با زیبایی بی‌نظیر و افسانه‌ای قرار داشت، و روبه‌روی آن، خود نقاش، باسیل هال‌وارد نشسته بود.

همچنان که نقاش به قامت موزون و سیمای دلربایی که در بوم نقاشی بازتابانده بود می‌نگریست، لبخندی از سر رضایت بر چهره‌اش نقش بست؛ اما ناگهان از جا پرید و چشمانش را بست، گویی می‌خواست رویایی شگفت را در ذهن خویش محبوس دارد.

لرد هنری با لحنی آرام گفت: «این بهترین شاهکاری است که تا به حال خلق کرده‌ای باسیل. تو باید حتماً آن را به گالری گروسونور بفرستی.»

باسیل سرش را تکان داد و گفت: «نه، من هرگز این تابلو را در هیچ کجا به نمایش نخواهم گذاشت.»

لرد هنری با شگفتی از میان حلقه‌های آبی دود سیگار به او نگریست: «به نمایش نخواهی گذاشت؟ آخر چرا؟ چه دلیلی داری؟ پرتره‌ای همچون این، تو را فرسنگ‌ها بالاتر از تمام هنرمندان انگلستان خواهد نشاند!»

باسیل با صدایی آرام و تأمل‌برانگیز پاسخ داد: «می‌دانم به من خواهی خندید هنری، اما من نمی‌توانم آن را به نمایش بگذارم؛ زیرا بیش از اندازه از روح و جان خودم را در این تابلو ریخته‌ام.»`,
  },
  {
    id: 'focused-momentum',
    title: 'Atomic Momentum: The Science of Focus',
    persianTitle: 'مومنتوم اتمی: علم تمرکز پایدار',
    author: 'Dr. Marcus Vance',
    persianAuthor: 'دکتر مارکوس ونس',
    genre: 'Cognitive Science & Performance',
    persianGenre: 'علوم شناختی و موفقیت فردی',
    mood: 'Energetic, authoritative, motivational',
    description: 'A breakdown of neuro-chemical pacing, deep work sprints, and effortless initiation.',
    wordCount: 2780,
    expectedEpisodes: 2,
    recommendedVoice: 'Puck',
    text: `CHAPTER I: THE NEUROCHEMISTRY OF INITIATION

Most people believe procrastination is an absence of willpower. Cognitive neuroscience demonstrates that it is fundamentally an emotional regulation crisis catalyzed by dopamine resistance. When you confront a massive project, your amygdala registers the expanse as cognitive friction.

To dismantle this resistance, elite performers engineer micro-initiations beneath the amygdala's alarm threshold. Consider the law of kinetic momentum: it requires four times more energy to set a stationary flywheel in motion than to maintain its velocity once turning. Once you cross the two-minute initiation threshold, your prefrontal cortex cascades endogenous dopamine.

First: The Two-Minute Micro-Anchor. Never sit down to write a whole chapter. Sit down to write twenty words.
Second: Cognitive Environmental Shielding. Eradicate visual micro-cues that trigger split-attention foraging.
Third: The Velocity Finish. Always terminate a work sprint when momentum is high, encoding positive anticipatory memory.


CHAPTER II: THE 10-MINUTE AUDIOBOOK CADENCE

In an era of hyper-fragmentation, the optimal cognitive cadence follows an ultradian rhythm: high-intensity immersion punctuated by intentional decompression.

A ten-minute audio segment contains approximately 1,350 spoken words. Ten minutes represents the exact psychological window wherein working memory operates without cognitive fatigue. By honoring this 10-minute cadence, you transition from passive consumption to active cognitive mastery.`,
    persianText: `فصل اول: عصب‌شناسی آغاز و شروع پایدار

بسیاری از مردم بر این باورند که اهمال‌کاری ناشی از کمبود اراده است. اما علوم شناختی مدرن ثابت کرده است که اهمال‌کاری اساساً یک بحران تنظیم هیجانی است که ناشی از مقاومت دوپامینی در مغز است. هنگامی که با پروژه‌ای عظیم و مبهم روبه‌رو می‌شوید، آمیگدال مغز آن را به عنوان اصطکاک شناختی و تهدید انرژی ثبت می‌کند.

افراد نخبه برای درهم شکستن این مقاومت، شروع‌های بسیار کوچک مهندسی می‌کنند. قانون حرکت کینتیک را به یاد آورید: به حرکت درآوردن یک چرخ لنگر ساکن به چهار برابر انرژی بیشتری نسبت به حفظ چرخش آن نیاز دارد. به محض عبور از آستانه دو دقیقه اول، قشر پیش‌پیشانی مغز دوپامین طبیعی آزاد می‌کند.

گام اول: لنگر دو دقیقه‌ای. هرگز برای نوشتن کل یک کتاب ننشینید؛ برای نوشتن تنها بیست کلمه بنشینید.
گام دوم: سپر محافظ محیطی. تمام نشانه‌های حواس‌پرتی بصری را حذف کنید.
گام سوم: پایان در اوج شتاب. کار خود را درست در لحظه‌ای که هنوز پرانرژی و مشتاقید به پایان برسانید تا خاطره‌ای اشتیاق‌آور در هیپوکامپ ذخیره شود.


فصل دوم: آهنگ ۱۰ دقیقه‌ای در یادگیری صوتی

در روزگار تکه‌تکه شدن توجه بشر، ذهن انسان نمی‌تواند ساعت‌های طولانی و بدون وقفه تمرکز خود را حفظ کند. بخش‌های صوتی ۱۰ دقیقه‌ای که حدود ۱,۳۵۰ کلمه دارند، دقیقاً منطبق بر پنجره استاندارد حافظه کاری انسان است که بدون خستگی، بالاترین بازده یادگیری و ماندگاری را به ارمغان می‌آورد.`,
  },
];
