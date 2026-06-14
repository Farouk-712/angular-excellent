# Test d’analyse incrémentale

Ce document sert à vérifier le comportement de l’analyse incrémentale lorsqu’un dépôt reçoit uniquement une modification textuelle.

L’objectif est de confirmer que le système détecte correctement un changement de documentation sans relancer une analyse complète inutile sur les fichiers de code.

## Contexte

Le projet SkillEvolve analyse les traces GitHub afin d’évaluer les compétences techniques des développeurs à partir de leurs contributions.

Lorsqu’un développeur ajoute ou modifie uniquement un fichier de documentation, le système doit reconnaître que la contribution est principalement textuelle.

Cette contribution ne doit pas être traitée comme une modification de logique métier, de structure applicative ou de qualité de code.

## Objectif du test

Ce test permet de vérifier les points suivants :

- la détection d’un nouveau commit après une première analyse ;
- le déclenchement de l’analyse incrémentale ;
- la classification de l’événement comme contribution documentaire ;
- l’absence d’analyse de fichier source lorsque le commit ne contient que du texte ;
- la mise à jour correcte de l’historique d’analyse du développeur.

## Description de la modification

Le développeur ajoute une documentation expliquant le rôle général du projet, son objectif fonctionnel et son intérêt dans le suivi des compétences.

La modification ne contient aucun fichier TypeScript, HTML, CSS, JavaScript, Python ou NestJS.

Elle ne contient pas non plus de configuration technique, de dépendances ou de logique exécutable.

## Résultat attendu

Après le push de ce fichier, l’analyse incrémentale doit considérer ce commit comme une contribution textuelle.

Le système peut augmenter les statistiques liées à la documentation ou à l’activité du développeur.

En revanche, les scores liés au code, à la complexité, à l’intégration backend ou à la qualité des composants ne doivent pas être recalculés à partir de ce fichier.

## Conclusion

Ce fichier permet de tester un cas simple où le développeur contribue uniquement à la documentation.

Il est utile pour vérifier que le pipeline distingue correctement les contributions de code et les contributions textuelles.

