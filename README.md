# SkillEvolve Angular Excellent Demo

Mini application Angular structurée pour tester un modèle d'analyse de qualité Angular.
Le domaine choisi est un tableau de bord de gestion de projets avec CRUD, filtres, formulaire réactif, règles métier, intégration backend simulée et usage RxJS.

## Critères volontairement couverts

| Critère SkillEvolve | Signaux dans le repo |
| --- | --- |
| structure | séparation `core`, `shared`, `features`, `domain`, `data-access`, `pages`, `components`, `utils` |
| template_quality | templates lisibles, control flow `@if/@for`, classes cohérentes, empty states, badges |
| routing_rendering | routes principales + lazy loading via `loadChildren` et `loadComponent` |
| state_management | store dédié avec `BehaviorSubject`, `combineLatest`, `shareReplay`, vm$ |
| backend_integration | `HttpClient`, interceptor, environment, fallback mock propre |
| forms | reactive forms typés, validators, FormArray, validation custom |
| business_logic | calcul de progression, santé projet, surcharge, retard, budget |
| crud | create, update, delete, list, detail |
| rxjs | debounceTime, distinctUntilChanged, combineLatest, switchMap, catchError, finalize, shareReplay |
| dependency_injection | `inject()`, services `providedIn: 'root'`, interceptor fonctionnel |
| code_hygiene | strict TS, types dédiés, fonctions pures, noms clairs |
| maintainability | petits composants, logique isolée, modèles typés, pas de duplication excessive |


```
