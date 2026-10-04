import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import { ScenarioRouteSync } from '../content/ScenarioRouteSync'
import { withScenario } from '../content/scenarioStore'

const AddGalleryPhotoPage = lazy(() => import('../pages/AddGalleryPhotoPage').then((module) => ({ default: module.AddGalleryPhotoPage })))
const AlbumPhotoNotePage = lazy(() => import('../pages/AlbumPhotoNotePage').then((module) => ({ default: module.AlbumPhotoNotePage })))
const ElderInfoPage = lazy(() => import('../pages/ElderInfoPage').then((module) => ({ default: module.ElderInfoPage })))
const FamilyEntryPage = lazy(() => import('../pages/FamilyEntryPage').then((module) => ({ default: module.FamilyEntryPage })))
const FrameAiPage = lazy(() => import('../pages/FrameAiPage').then((module) => ({ default: module.FrameAiPage })))
const FrameRiverInterviewPage = lazy(() => import('../pages/FrameRiverInterviewPage').then((module) => ({ default: module.FrameRiverInterviewPage })))
const FrameBindPage = lazy(() => import('../pages/FrameBindPage').then((module) => ({ default: module.FrameBindPage })))
const FrameFamilyRecapPage = lazy(() => import('../pages/FrameFamilyRecapPage').then((module) => ({ default: module.FrameFamilyRecapPage })))
const FrameFamilySpacePage = lazy(() => import('../pages/FrameFamilySpacePage').then((module) => ({ default: module.FrameFamilySpacePage })))
const FrameExplorePage = lazy(() => import('../pages/FrameExplorePage').then((module) => ({ default: module.FrameExplorePage })))
const FrameFragmentsPage = lazy(() => import('../pages/FrameFragmentsPage').then((module) => ({ default: module.FrameFragmentsPage })))
const FrameHealthDetailPage = lazy(() => import('../pages/FrameHealthPage').then((module) => ({ default: module.FrameHealthDetailPage })))
const FrameHealthPage = lazy(() => import('../pages/FrameHealthPage').then((module) => ({ default: module.FrameHealthPage })))
const FrameHomePage = lazy(() => import('../pages/FrameHomePage').then((module) => ({ default: module.FrameHomePage })))
const FrameInteractionDetailPage = lazy(() => import('../pages/FrameInteractionDetailPage').then((module) => ({ default: module.FrameInteractionDetailPage })))
const FrameInteractionLetterPage = lazy(() => import('../pages/FrameInteractionLetterPage').then((module) => ({ default: module.FrameInteractionLetterPage })))
const FrameInteractionsPage = lazy(() => import('../pages/FrameInteractionsPage').then((module) => ({ default: module.FrameInteractionsPage })))
const FrameMemoryStoryPage = lazy(() => import('../pages/FrameMemoryStoryPage').then((module) => ({ default: module.FrameMemoryStoryPage })))
const FrameRiverPage = lazy(() => import('../pages/FrameRiverPage').then((module) => ({ default: module.FrameRiverPage })))
const FrameRiverStagePage = lazy(() => import('../pages/FrameRiverPage').then((module) => ({ default: module.FrameRiverStagePage })))
const FrameSettingsPage = lazy(() => import('../pages/FrameSettingsPage').then((module) => ({ default: module.FrameSettingsPage })))
const FrameSquarePage = lazy(() => import('../pages/FrameSquarePage').then((module) => ({ default: module.FrameSquarePage })))
const FrameSquareEventPage = lazy(() => import('../pages/FrameSquarePage').then((module) => ({ default: module.FrameSquareEventPage })))
const FrameSquareHeroesPage = lazy(() => import('../pages/FrameSquarePage').then((module) => ({ default: module.FrameSquareHeroesPage })))
const FrameStudyPage = lazy(() => import('../pages/FrameStudyPage').then((module) => ({ default: module.FrameStudyPage })))
const FrameStudyResultPage = lazy(() => import('../pages/FrameStudyPage').then((module) => ({ default: module.FrameStudyResultPage })))
const FrameStudyWritePage = lazy(() => import('../pages/FrameStudyPage').then((module) => ({ default: module.FrameStudyWritePage })))
const FrameStudyItemPage = lazy(() => import('../pages/FrameStudyModulePage').then((module) => ({ default: module.FrameStudyItemPage })))
const FrameStudyModulePage = lazy(() => import('../pages/FrameStudyModulePage').then((module) => ({ default: module.FrameStudyModulePage })))
const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
const InteractionDetailPage = lazy(() => import('../pages/InteractionDetailPage').then((module) => ({ default: module.InteractionDetailPage })))
const MemberCapturePage = lazy(() => import('../pages/MemberCapturePage').then((module) => ({ default: module.MemberCapturePage })))
const MemberExplorationPage = lazy(() => import('../pages/MemberExplorationPage').then((module) => ({ default: module.MemberExplorationPage })))
const MemberFamilyTreePage = lazy(() => import('../pages/MemberFamilyTreePage').then((module) => ({ default: module.MemberFamilyTreePage })))
const MemberMemoriesPage = lazy(() => import('../pages/MemberMemoriesPage').then((module) => ({ default: module.MemberMemoriesPage })))
const MemberMemoryStagePage = lazy(() => import('../pages/MemberMemoriesPage').then((module) => ({ default: module.MemberMemoryStagePage })))
const MemberProfilePage = lazy(() => import('../pages/MemberProfilePage').then((module) => ({ default: module.MemberProfilePage })))
const MemoryStoryDetailPage = lazy(() => import('../pages/MemoryStoryDetailPage').then((module) => ({ default: module.MemoryStoryDetailPage })))
const NewInteractionPage = lazy(() => import('../pages/NewInteractionPage').then((module) => ({ default: module.NewInteractionPage })))
const PrototypeRedirectPage = lazy(() => import('../pages/PrototypeRedirectPage').then((module) => ({ default: module.PrototypeRedirectPage })))
const TeamInvitePage = lazy(() => import('../pages/TeamInvitePage').then((module) => ({ default: module.TeamInvitePage })))

function routeElement(element: ReactNode) {
  return (
    <>
      <ScenarioRouteSync />
      <Suspense fallback={<div className="proto-route-loading" aria-label="页面加载中" />}>{element}</Suspense>
    </>
  )
}

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/member/home" replace />,
  },
  {
    path: '/member',
    element: <Navigate to="/member/home" replace />,
  },
  {
    path: '/member/entry',
    element: routeElement(<FamilyEntryPage />),
  },
  {
    path: '/member/onboarding/elder',
    element: routeElement(<ElderInfoPage />),
  },
  {
    path: '/member/home',
    element: routeElement(<HomePage activeTab="status" />),
  },
  {
    path: '/member/treasure',
    element: routeElement(<HomePage activeTab="treasure" />),
  },
  {
    path: '/member/gallery',
    element: routeElement(<HomePage activeTab="gallery" />),
  },
  {
    path: '/member/gallery/add',
    element: routeElement(<AddGalleryPhotoPage />),
  },
  {
    path: '/member/gallery/photo-note',
    element: routeElement(<AlbumPhotoNotePage />),
  },
  {
    path: '/member/gallery/photo/:id',
    element: routeElement(<AlbumPhotoNotePage />),
  },
  {
    path: '/member/family-tree',
    element: routeElement(<MemberFamilyTreePage />),
  },
  {
    path: '/member/exploration',
    element: routeElement(<MemberExplorationPage />),
  },
  {
    path: '/member/capture/:mode',
    element: routeElement(<MemberCapturePage />),
  },
  {
    path: '/member/memories',
    element: routeElement(<MemberMemoriesPage />),
  },
  {
    path: '/member/memories/stage/:id',
    element: routeElement(<MemberMemoryStagePage />),
  },
  {
    path: '/member/memories/story/:id',
    element: routeElement(<MemoryStoryDetailPage />),
  },
  {
    path: '/member/interactions/new',
    element: routeElement(<NewInteractionPage />),
  },
  {
    path: '/member/interactions/:id',
    element: routeElement(<InteractionDetailPage />),
  },
  {
    path: '/member/profile',
    element: routeElement(<MemberProfilePage />),
  },
  {
    path: '/_team/invite',
    element: routeElement(<TeamInvitePage />),
  },
  {
    path: '/_prototype',
    element: routeElement(<PrototypeRedirectPage />),
  },
  {
    path: '/frame/bind',
    element: routeElement(<FrameBindPage />),
  },
  {
    path: '/frame',
    element: routeElement(<FrameHomePage />),
  },
  {
    path: '/frame/ai',
    element: routeElement(<FrameAiPage />),
  },
  {
    path: '/frame/family',
    element: routeElement(<FrameFamilySpacePage />),
  },
  {
    path: '/frame/family/recap',
    element: routeElement(<FrameFamilyRecapPage />),
  },
  {
    path: '/frame/explore',
    element: routeElement(<FrameExplorePage />),
  },
  {
    path: '/frame/fragments',
    element: routeElement(<FrameFragmentsPage />),
  },
  {
    path: '/frame/health',
    element: routeElement(<FrameHealthPage />),
  },
  {
    path: '/frame/health/:id',
    element: routeElement(<FrameHealthDetailPage />),
  },
  {
    path: '/frame/interactions',
    element: routeElement(<FrameInteractionsPage />),
  },
  {
    path: '/frame/interactions/:id/letter',
    element: routeElement(<FrameInteractionLetterPage />),
  },
  {
    path: '/frame/interactions/:id',
    element: routeElement(<FrameInteractionDetailPage />),
  },
  {
    path: '/frame/memories',
    element: routeElement(<FrameRiverPage />),
  },
  {
    path: '/frame/memories/story/:id',
    element: routeElement(<FrameMemoryStoryPage />),
  },
  {
    path: '/frame/study',
    element: routeElement(<FrameStudyPage />),
  },
  {
    path: '/frame/diary',
    element: routeElement(<FrameStudyWritePage />),
  },
  {
    path: '/frame/study/write',
    element: routeElement(<FrameStudyWritePage />),
  },
  {
    path: '/frame/study/result',
    element: routeElement(<FrameStudyResultPage />),
  },
  {
    path: '/frame/study/module/:id',
    element: routeElement(<FrameStudyModulePage />),
  },
  {
    path: '/frame/study/module/:id/item/:itemId',
    element: routeElement(<FrameStudyItemPage />),
  },
  {
    path: '/frame/river',
    element: routeElement(<FrameRiverPage />),
  },
  {
    path: '/frame/river/interview',
    element: routeElement(<FrameRiverInterviewPage />),
  },
  {
    path: '/frame/river/stage/:id',
    element: routeElement(<FrameRiverStagePage />),
  },
  {
    path: '/frame/river/stage/:id/story/:storyId',
    element: routeElement(<FrameMemoryStoryPage />),
  },
  {
    path: '/frame/square',
    element: routeElement(<FrameSquarePage />),
  },
  {
    path: '/frame/square/event/:id',
    element: routeElement(<FrameSquareEventPage />),
  },
  {
    path: '/frame/square/heroes',
    element: routeElement(<FrameSquareHeroesPage />),
  },
  {
    path: '/frame/settings',
    element: routeElement(<FrameSettingsPage />),
  },
  {
    path: '/frame/*',
    element: <Navigate to={withScenario('/frame')} replace />,
  },
  {
    path: '*',
    element: <Navigate to="/member/home" replace />,
  },
])
