# Combat Protocol — Realism Pass v1.7

**التاريخ:** 25 أكتوبر 2026  
**الحالة:** منفذ داخل الـPrototype المحلي

هذه الحزمة ترفع الإحساس الواقعي بصرياً وسمعياً وحركياً باستخدام أدوات المشروع
الحالية، بدون CDN أو أصول خارجية. لا تدعي أنها assets production أو animation
capture نهائية.

## الأسلحة

- receiver بطبقات ومسامير وbolt وtrigger guard بدلاً من صندوق واحد.
- handguard أضيفت له rails وfasteners وsilhouette أكثر تماسكاً.
- لكل weapon family palette وخامة procedural مختلفة.
- optics وfront sight وmuzzle brake أوضح من قبل.
- casing ejection يظهر بعد كل طلقة ويسقط بجاذبية وارتداد بسيط.
- bolt kickback قصير أثناء إطلاق النار.
- SG-12 وBR-7 وVPR-5 يحتفظ كل منها بتعديلات silhouette الخاصة به.
- textures أصبحت deterministic حتى لا يتغير شكل السلاح بين التشغيلات والاختبارات.

## الكاميرا والحركة

- breathing sway خفيف عند الوقوف.
- head bob مختلف للمشي والجري.
- landing kick قصير بعد الهبوط.
- recoil وcamera shake ما زالا منفصلين حتى لا يصبح التصويب عشوائياً بالكامل.

## العالم والإضاءة

- كل خريطة تملك environment palette مستقلة: sky، fog، ground، sun، hemisphere،
  fill، وlamps.
- Night Bazaar أصبح ليلياً بسطوع أقل وfog أقرب وأضواء cyan/amber.
- Drydock 9 أصبح بارداً ومعدنياً، وباقي الخرائط لها تدرجات صناعية مختلفة.
- الحاويات أضيفت لها خطوط أبواب ولوحات serial.
- الحواجز أضيفت لها hazard strips.
- الأرض أضيفت لها stains وlane variation deterministic.

## الواقعية التي تحتاج مرحلة إنتاج

- skeletal hand animation وreload animation حقيقية.
- PBR normal/roughness/AO maps عالية الجودة.
- material decals وdamage deformation.
- positional audio حقيقي متعدد الطبقات.
- weapon inspect وshell physics متقدمة.
- authored environment meshes وLOD/HLOD.

الهدف ليس إضافة لمعان عشوائي؛ الواقعية هنا تعني scale ومواد وإضاءة وfeedback
متسقة، مع الحفاظ على وضوح المنافسة.
